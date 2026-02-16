import { CONFIG } from './config.js';

export const fetchFromProxy = async (proxy, targetUrl, timeout) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    try {
        let rawContent;
        let responseMeta = { contentType: 'unknown', redirected: false };

        const url = proxy.type === 'direct' ? targetUrl : proxy.url(targetUrl);
        const resp = await fetch(url, { signal: controller.signal });

        if (!resp.ok) throw new Error(`${proxy.name} fetch failed`);

        if (proxy.type === 'json') {
            const data = await resp.json();
            rawContent = data.contents;
            if (data.status && rawContent?.startsWith('data:')) {
                responseMeta.contentType = rawContent.split(';')[0].split(':')[1];
            }
        } else {
            rawContent = await resp.text();
            responseMeta.contentType = resp.headers.get('content-type');
        }

        if (!rawContent) throw new Error('Empty response');

        // Handle Base64
        if (rawContent.startsWith('data:') && rawContent.includes('base64,')) {
            rawContent = atob(rawContent.split('base64,')[1]);
        }

        let json;
        try {
            json = JSON.parse(rawContent);
        } catch (e) {
            const jsonMatch = rawContent.match(/\[[\s\S]*\]|\{[\s\S]*\}/);
            if (jsonMatch) json = JSON.parse(jsonMatch[0]);
            else throw new Error('No valid JSON found');
        }

        return { json, responseMeta, proxyName: proxy.name };
    } finally {
        clearTimeout(id);
    }
};

export const checkDNS = async (domain) => {
    const startTime = Date.now();
    try {
        const resp = await fetch(`https://cloudflare-dns.com/dns-query?name=${domain}&type=A`, {
            headers: { 'accept': 'application/dns-json' }
        });
        const data = await resp.json();
        const duration = Date.now() - startTime;

        if (data.Answer && data.Answer.length > 0) {
            return {
                success: true,
                ip: data.Answer[0].data,
                duration: duration
            };
        }
        return { success: false, error: 'No A records found', code: 'NXDOMAIN' };
    } catch (e) {
        return { success: false, error: e.message, code: 'FETCH_ERROR' };
    }
};

export const tryFetchWithProxies = async (targetUrl) => {
    try {
        return await Promise.any(CONFIG.PROXIES.map(p => fetchFromProxy(p, targetUrl, CONFIG.TIMEOUTS.FREE_PROXY)));
    } catch (e) {
        console.log(`Free proxies failed for ${targetUrl}, falling back to worker...`);
    }

    if (CONFIG.MY_PROXY_URL) {
        const workerProxy = { name: 'My Worker (Backup)', type: 'simple', url: (target) => `${CONFIG.MY_PROXY_URL}?url=${encodeURIComponent(target)}` };
        return await fetchFromProxy(workerProxy, targetUrl, CONFIG.TIMEOUTS.WORKER_PROXY);
    }
    throw new Error('All proxies failed');
};
