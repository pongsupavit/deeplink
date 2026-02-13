export const trackEvent = (name, params = {}) => {
    if (typeof window.gtag === "function") {
        window.gtag("event", name, params);
    }
};

export const isValidUrl = (value) => {
    try {
        const url = new URL(value);
        return url.protocol === "http:" || url.protocol === "https:";
    } catch {
        return false;
    }
};

export const isValidUriScheme = (value) => {
    // URIs cannot contain spaces
    if (/\s/.test(value)) return false;

    const match = value.match(/^([a-z][a-z0-9+.-]*):/i);
    if (!match) return false;

    const scheme = match[1].toLowerCase();
    if (scheme === "http" || scheme === "https") return false;

    // For deep links, we usually expect scheme://path
    if (value.startsWith(`${scheme}://`)) {
        return value.length > scheme.length + 3;
    }

    // Also support scheme:path (like tel: or mailto:)
    return value.length > scheme.length + 1;
};

export const validateLink = (value) => {
    if (isValidUrl(value)) return { ok: true, type: "URL" };
    if (isValidUriScheme(value)) return { ok: true, type: "URI scheme" };
    return { ok: false, type: "" };
};

export const autosizeTextarea = (inputEl) => {
    if (!inputEl || inputEl.tagName !== "TEXTAREA") return;
    inputEl.style.height = "auto";
    const next = Math.max(inputEl.scrollHeight, 40);
    inputEl.style.height = `${next}px`;
};

export const isDesktop = (query) => window.matchMedia(query).matches;

export const getSystemTheme = () => (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");

export const getPreferredTheme = () => {
    const saved = localStorage.getItem("theme");
    return (saved === "light" || saved === "dark" || saved === "auto") ? saved : "auto";
};

export const applyTheme = (theme) => {
    const resolved = theme === "auto" ? getSystemTheme() : theme;
    document.documentElement.dataset.theme = resolved;
    document.querySelectorAll(".theme-option").forEach((btn) => {
        btn.setAttribute("aria-pressed", btn.dataset.theme === theme ? "true" : "false");
    });
};
