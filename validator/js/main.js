import { tryFetchWithProxies, checkDNS } from './api.js';
import { analyzeCommon, analyzeIOS, analyzeAndroid, extractIOSApps, extractAndroidApps } from './validator.js';
import { DOM, renderLoading, renderError, buildCommonHTML, buildResultHTML, buildRawJSONSection } from './ui.js';

let validationResults = { domain: '', ios: null, android: null, dns: null };

const handleValidate = async () => {
    let input = DOM.domainInput.value.trim();
    if (!input) {
        alert("Please enter a domain or URL");
        return;
    }

    let domain = input.includes('://') ? new URL(input).hostname : input.split('/')[0];
    domain = domain.replace(/\/$/, '').toLowerCase();
    validationResults.domain = domain;

    if (typeof window.gtag === 'function') {
        window.gtag('event', 'validation_button_click', { domain: domain });
    }

    renderLoading(domain);

    const aasaUrl = `https://${domain}/.well-known/apple-app-site-association`;
    const assetLinksUrl = `https://${domain}/.well-known/assetlinks.json`;

    const [dnsRes, iosRes, androidRes] = await Promise.allSettled([
        checkDNS(domain),
        tryFetchWithProxies(aasaUrl),
        tryFetchWithProxies(assetLinksUrl)
    ]);

    validationResults.dns = dnsRes.status === 'fulfilled' ? dnsRes.value : { success: false, error: 'DNS lookup failed', code: 'PROMISE_REJECTED' };
    validationResults.ios = iosRes.status === 'fulfilled' ? { ...iosRes.value, url: aasaUrl } : { error: iosRes.reason.message, url: aasaUrl };
    validationResults.android = androidRes.status === 'fulfilled' ? { ...androidRes.value, url: assetLinksUrl } : { error: androidRes.reason.message, url: androidRes.reason.message };

    renderResults();
};

const renderResults = () => {
    const commonChecks = analyzeCommon(validationResults.dns, validationResults.domain, validationResults.ios, validationResults.android);

    let html = `
        <div class="result-summary" style="margin-bottom: 32px; text-align: center;">
            <h2 style="margin: 0; font-size: 1.5rem; color: var(--ink);">Results for ${validationResults.domain}</h2>
        </div>
        
        <div class="common-section" style="margin-bottom: 48px;">
            ${buildCommonHTML(commonChecks)}
        </div>
    `;

    // If DNS failed, skip specific platform checks
    if (!validationResults.dns.success) {
        DOM.resultArea.innerHTML = html;
        return;
    }

    html += `<div class="results-grid">
            <div class="platform-column">
    `;

    // iOS Column
    const ios = validationResults.ios;
    if (ios.error) {
        html += `<div class="platform-header"><span class="platform-icon">🍎</span><span>iOS Validation</span></div>`;
        html += renderError(ios.error, ios.url);
    } else {
        const checks = analyzeIOS(ios.json, DOM.prefixInput.value.trim(), DOM.bundleInput.value.trim(), ios.responseMeta, ios.url);
        html += buildResultHTML(ios.url, checks, extractIOSApps(ios.json), 'iOS', DOM.bundleInput.value.trim());
    }

    html += `</div><div class="platform-column">`;

    // Android Column
    const android = validationResults.android;
    if (android.error) {
        html += `<div class="platform-header"><span class="platform-icon">🤖</span><span>Android Validation</span></div>`;
        html += renderError(android.error, android.url);
    } else {
        const checks = analyzeAndroid(android.json, DOM.packageInput.value.trim(), android.responseMeta, android.url);
        html += buildResultHTML(android.url, checks, extractAndroidApps(android.json), 'Android', DOM.packageInput.value.trim());
    }

    html += `</div></div>`;

    // Add Raw Source Section at the bottom if any files were fetched
    if (!ios.error || !android.error) {
        html += buildRawJSONSection(ios.error ? null : ios, android.error ? null : android);
    }

    DOM.resultArea.innerHTML = html;
};

// Listeners
DOM.validateBtn.onclick = handleValidate;
[DOM.domainInput, DOM.prefixInput, DOM.bundleInput, DOM.packageInput].forEach(el => {
    el.onkeypress = (e) => { if (e.key === 'Enter') handleValidate(); };
});
DOM.domainInput.focus();

// Event Delegation for Copy Buttons
DOM.resultArea.addEventListener('click', (e) => {
    const btn = e.target.closest('.copy-btn');
    if (!btn) return;

    const targetId = btn.getAttribute('data-target');
    const textarea = document.getElementById(targetId);
    if (!textarea) return;

    const originalContent = btn.innerHTML;

    // Copy to clipboard
    navigator.clipboard.writeText(textarea.value).then(() => {
        // Feedback State
        btn.innerHTML = `
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            Copied!
        `;
        btn.classList.add('copied');

        // Reset after 2s
        setTimeout(() => {
            btn.innerHTML = originalContent;
            btn.classList.remove('copied');
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy:', err);
        // Fallback or error indication
        btn.innerText = 'Error';
        setTimeout(() => {
            btn.innerHTML = originalContent;
        }, 2000);
    });
});
