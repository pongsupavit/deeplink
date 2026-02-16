window.GLOBAL_SVGS = {
    THEME_LIGHT: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`,
    THEME_DARK: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`
};

(function () {
    // Detect base path dynamically based on where constants.js is loaded from
    const scriptSrc = document.currentScript ? document.currentScript.src : '';
    let base = '/';

    if (scriptSrc.includes('/constants.js')) {
        try {
            const url = new URL(scriptSrc);
            base = url.pathname.replace('constants.js', '');
        } catch (e) {
            if (window.location.pathname.includes('/deeplink/')) base = '/deeplink/';
        }
    }

    window.DEEPLINK_CONFIG = {
        base: base,
        tools: [
            { id: 'testing', name: 'Tester', path: 'testing/' },
            { id: 'validator', name: 'Validator', path: 'validator/' }
        ],
        resolvePath: function (relativePath) {
            // relativePath should be 'testing/' or '' for root
            return this.base + relativePath;
        }
    };
})();
