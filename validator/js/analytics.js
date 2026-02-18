export const trackEvent = (name, params = {}) => {
    if (typeof window.gtag === "function") {
        window.gtag("event", name, params);
    }
};
