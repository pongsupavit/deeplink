import { CONFIG } from './config.js';

const debug = (...args) => {
    if (CONFIG.IS_DEBUG) console.log(...args);
};

const DOH_PROVIDERS = [
    { name: 'Google DoH', url: (domain) => `https://dns.google/resolve?name=${domain}&type=A`, headers: {} },
    { name: 'Cloudflare DoH', url: (domain) => `https://cloudflare-dns.com/dns-query?name=${domain}&type=A`, headers: { 'accept': 'application/dns-json' } }
];

const parseJsonLoose = (rawContent) => {
    try {
        return JSON.parse(rawContent);
    } catch (e) {
        const jsonMatch = rawContent.match(/\[[\s\S]*\]|\{[\s\S]*\}/);
        if (jsonMatch) return JSON.parse(jsonMatch[0]);
        throw new Error('No valid JSON found');
    }
};

export const fetchFromProxy = async (proxy, targetUrl, timeout) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    try {
        debug('[Validator] Trying proxy', proxy.name, targetUrl);
        let rawContent;
        let responseMeta = { contentType: 'unknown', redirected: false };

        const url = proxy.type === 'direct' ? targetUrl : proxy.url(targetUrl);
        const resp = await fetch(url, { signal: controller.signal });

        if (resp.status === 404) {
            return { error: 'Not Found', status: 404, proxyName: proxy.name };
        }
        if (!resp.ok) throw new Error(`${proxy.name} fetch failed (${resp.status})`);

        if (proxy.type === 'json' || (proxy.type === 'simple' && proxy.name === 'AllOrigins')) {
            const data = await resp.json();

            // AllOrigins specific 404 handling inside JSON
            if (proxy.name === 'AllOrigins' && data.status?.http_code === 404) {
                return { error: 'Not Found', status: 404, proxyName: proxy.name };
            }
            if (proxy.name === 'AllOrigins' && data.status?.http_code !== 200) {
                throw new Error(`AllOrigins error (${data.status?.http_code})`);
            }

            rawContent = data.contents;
            if (data.status && rawContent?.startsWith('data:')) {
                responseMeta.contentType = rawContent.split(';')[0].split(':')[1];
            }
        } else {
            rawContent = await resp.text();
            responseMeta.contentType = resp.headers.get('content-type');
        }

        if (!rawContent) throw new Error('Empty response');

        if (rawContent.startsWith('data:') && rawContent.includes('base64,')) {
            rawContent = atob(rawContent.split('base64,')[1]);
        }

        const json = parseJsonLoose(rawContent);

        return { json, responseMeta, proxyName: proxy.name };
    } finally {
        clearTimeout(id);
    }
};

export const checkDNS = async (domain) => {
    const startTime = Date.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CONFIG.TIMEOUTS.FREE_PROXY);

    const providerPromises = DOH_PROVIDERS.map((provider) => (async () => {
        debug('[Validator] DNS provider', provider.name, domain);
        const resp = await fetch(provider.url(domain), { headers: provider.headers, signal: controller.signal });
        const data = await resp.json();
        if (data.Answer && data.Answer.length > 0) {
            return { provider: provider.name, ip: data.Answer[0].data };
        }
        throw new Error(`${provider.name} no A records`);
    })());

    try {
        const result = await Promise.any(providerPromises);
        const duration = Date.now() - startTime;
        return { success: true, ip: result.ip, duration, provider: result.provider };
    } catch (e) {
        const duration = Date.now() - startTime;
        if (controller.signal.aborted) {
            return { success: false, error: 'DNS timeout', code: 'TIMEOUT', duration };
        }
        return { success: false, error: 'Failed to fetch', code: 'FETCH_ERROR', duration };
    } finally {
        clearTimeout(timeoutId);
    }
};

export const fetchBundleFromWorker = async (domain) => {
    if (!CONFIG.MY_PROXY_URL) throw new Error('Worker URL not configured');
    debug('[Validator] Worker bundle', domain);
    const resp = await fetch(`${CONFIG.MY_PROXY_URL}?url=${encodeURIComponent(domain)}`);
    if (!resp.ok) throw new Error('Worker bundle fetch failed');
    return await resp.json();
};

export const tryFetchWithProxies = async (targetUrl) => {
    debug('[Validator] Free proxy race start', targetUrl);
    return await Promise.any(CONFIG.PROXIES.map(p => fetchFromProxy(p, targetUrl, CONFIG.TIMEOUTS.FREE_PROXY)));
};
