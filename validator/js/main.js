import { fetchBundleFromWorker, checkDNS, tryFetchWithProxies } from './api.js';
import { CONFIG } from './config.js';
import {
    analyzeCommon, analyzeIOS, analyzeAndroid,
    extractIOSApps, extractAndroidApps
} from './validator.js';
import {
    DOM, renderLoading, renderError,
    buildCommonHTML, buildResultHTML, buildRawJSONSection
} from './ui.js';

// Central State
const state = {
    domain: '',
    iosPrefix: '',
    iosBundle: '',
    androidPackage: '',
    results: {
        dns: null,
        ios: null,
        android: null
    }
};

const resetState = (domain, prefix, bundle, pkg) => {
    state.domain = domain;
    state.iosPrefix = prefix;
    state.iosBundle = bundle;
    state.androidPackage = pkg;
    state.results = { dns: null, ios: null, android: null };
};

/**
 * Renders the final results to the DOM
 */
const renderResults = () => {
    const aasaUrl = `https://${state.domain}/.well-known/apple-app-site-association`;
    const assetLinksUrl = `https://${state.domain}/.well-known/assetlinks.json`;

    const commonChecks = analyzeCommon(state.results.dns, state.domain, state.results.ios, state.results.android);

    let html = `
        <div class="results-header">
            <h2>Results for <span>${state.domain}</span></h2>
        </div>
        
        <div class="common-section">
            ${buildCommonHTML(commonChecks)}
        </div>
        
        <div class="results-grid">
            <div class="platform-column">
                <div class="platform-header">
                    <span class="platform-icon">🍎</span>
                    <span>iOS Validation</span>
                </div>
                ${state.results.ios?.error
            ? renderError(state.results.ios.error, aasaUrl, true)
            : buildResultHTML(aasaUrl, analyzeIOS(state.results.ios.json, state.iosPrefix, state.iosBundle, state.results.ios.responseMeta, aasaUrl), extractIOSApps(state.results.ios.json), 'iOS', state.iosBundle)
        }
            </div>
            <div class="platform-column">
                <div class="platform-header">
                    <span class="platform-icon">🤖</span>
                    <span>Android Validation</span>
                </div>
                ${state.results.android?.error
            ? renderError(state.results.android.error, assetLinksUrl, true)
            : buildResultHTML(assetLinksUrl, analyzeAndroid(state.results.android.json, state.androidPackage, state.results.android.responseMeta, assetLinksUrl), extractAndroidApps(state.results.android.json), 'Android', state.androidPackage)
        }
            </div>
        </div>
        
        ${buildRawJSONSection(state.results.ios, state.results.android)}
    `;

    DOM.resultArea.innerHTML = html;
};

/**
 * Executes the worker fallback logic to supplement missing results
 */
const performFallback = async (domain) => {
    try {
        const bundle = await fetchBundleFromWorker(domain);

        // Merge worker results into state, prioritizing worker only for failed checks
        if (!state.results.dns?.success) {
            state.results.dns = bundle?.dns || { success: false, error: 'DNS lookup failed' };
        }

        if (state.results.ios?.error || !state.results.ios) {
            state.results.ios = bundle?.ios?.success
                ? {
                    ...bundle.ios,
                    responseMeta: {
                        ...(bundle.ios.responseMeta || {}),
                        contentType: bundle.ios.contentType || bundle.ios.responseMeta?.contentType || 'unknown',
                        proxyName: 'Worker'
                    }
                }
                : { error: bundle?.ios?.error || 'AASA fetch failed' };
        }

        if (state.results.android?.error || !state.results.android) {
            state.results.android = bundle?.android?.success
                ? {
                    ...bundle.android,
                    responseMeta: {
                        ...(bundle.android.responseMeta || {}),
                        contentType: bundle.android.contentType || bundle.android.responseMeta?.contentType || 'unknown',
                        proxyName: 'Worker'
                    }
                }
                : { error: bundle?.android?.error || 'Assetlinks fetch failed' };
        }

        renderResults();
    } catch (workerErr) {
        console.error('[Orchestrator] Worker Fallback Failure', workerErr);
        state.results.dns = state.results.dns || { success: false, error: 'Connectivity failure' };
        state.results.ios = state.results.ios || { error: 'Service Unavailable' };
        state.results.android = state.results.android || { error: 'Service Unavailable' };
        renderResults();
    }
};

/**
 * Main Orchestrator
 */
const handleValidate = async () => {
    const input = DOM.domainInput.value.trim().toLowerCase();
    const domain = input.includes('://') ? new URL(input).hostname : input.split('/')[0];
    if (!domain) return;

    resetState(
        domain,
        DOM.prefixInput.value.trim(),
        DOM.bundleInput.value.trim(),
        DOM.packageInput.value.trim()
    );

    renderLoading(domain);

    const aasaUrl = `https://${domain}/.well-known/apple-app-site-association`;
    const assetLinksUrl = `https://${domain}/.well-known/assetlinks.json`;

    try {
        const [dnsRes, iosRes, androidRes] = await Promise.all([
            checkDNS(domain),
            tryFetchWithProxies(aasaUrl),
            tryFetchWithProxies(assetLinksUrl)
        ]);

        state.results.dns = dnsRes;
        state.results.ios = iosRes;
        state.results.android = androidRes;

        // Quota Optimization: Only fallback if DNS failed or if proxies failed to get a definitive 200/404
        // If a proxy returns 404, we trust it and don't waste worker quota.
        const needsFallback =
            !dnsRes.success ||
            (iosRes.error && iosRes.status !== 404) ||
            (androidRes.error && androidRes.status !== 404);

        if (needsFallback) {
            if (CONFIG.IS_DEBUG) console.log('[Orchestrator] Partial proxy failure, falling back to worker');
            await performFallback(domain);
        } else {
            renderResults();
        }
    } catch (e) {
        if (CONFIG.IS_DEBUG) console.log('[Orchestrator] Fatal error, attempting worker fallback', e.message);
        await performFallback(domain);
    }
};

// Event Listeners
DOM.validateBtn.onclick = handleValidate;
[DOM.domainInput, DOM.prefixInput, DOM.bundleInput, DOM.packageInput].forEach(el => {
    el.onkeypress = (e) => { if (e.key === 'Enter') handleValidate(); };
});

DOM.resultArea.addEventListener('click', async (e) => {
    const btn = e.target.closest('.copy-btn');
    if (!btn) return;

    const textarea = document.getElementById(btn.dataset.target);
    if (!textarea) return;

    try {
        await navigator.clipboard.writeText(textarea.value);
        const textSpan = btn.querySelector('.copy-btn__text');
        if (!textSpan) return;
        const originalText = textSpan.textContent;
        textSpan.textContent = 'Copied';
        btn.classList.add('copied');
        setTimeout(() => {
            textSpan.textContent = originalText;
            btn.classList.remove('copied');
        }, 2000);
    } catch (err) {
        console.error('Copy failed', err);
    }
});

DOM.domainInput.focus();
