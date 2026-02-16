export const CONFIG = {
    MY_PROXY_URL: 'https://deeplink-validator.pongsupavit.workers.dev',
    PROXIES: [
        { name: 'AllOrigins', type: 'json', url: (target) => `https://api.allorigins.win/get?url=${encodeURIComponent(target)}&timestamp=${Date.now()}` },
        { name: 'CORS Proxy IO', type: 'simple', url: (target) => `https://corsproxy.io/?${encodeURIComponent(target)}` }
    ],
    TIMEOUTS: {
        FREE_PROXY: 8000,
        WORKER_PROXY: 8000
    },
    IS_DEBUG: true
};
