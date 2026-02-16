// Navigation script loaded synchronously

(function () {
    const PATHS = {
        root: '/',
        testing: '/testing/',
        validator: '/validator/'
    };

    // Determine current path depth to adjust links if needed (for relative paths)
    // Assuming flat structure: root, /testing/, /validator/
    // A simple approach is to use absolute paths since we are on the same domain.

    function injectNav() {
        // Don't inject if already exists
        if (document.querySelector('.global-nav')) return;

        const navHTML = `
            <nav class="global-nav">
                <div class="global-nav__content">
                    <a href="${PATHS.root}" class="global-nav__logo">
                        <span>⚡️</span> Deeplink Tools
                    </a>
                    <div class="global-nav__right" style="display: flex; align-items: center;">
                        <div class="global-nav__links">
                            <a href="${PATHS.testing}" class="global-nav__link" data-path="testing">Tester</a>
                            <a href="${PATHS.validator}" class="global-nav__link" data-path="validator">Validator</a>
                        </div>
                        <button class="global-nav__theme-btn" id="themeToggle" aria-label="Toggle Theme">
                            ${GLOBAL_SVGS.THEME_LIGHT}
                        </button>
                    </div>
                </div>
            </nav>
        `;

        // Inject Nav
        document.body.insertAdjacentHTML('afterbegin', navHTML);

        highlightActiveLink();
        initTheme();
    }

    function highlightActiveLink() {
        const path = window.location.pathname;
        let activeKey = '';
        if (path.includes('/testing/')) activeKey = 'testing';
        else if (path.includes('/validator/')) activeKey = 'validator';

        if (activeKey) {
            const link = document.querySelector(`.global-nav__link[data-path="${activeKey}"]`);
            if (link) link.classList.add('is-active');
        }
    }

    function initTheme() {
        const toggle = document.getElementById('themeToggle');
        if (!toggle) return;

        // Check stored preference
        const storedTheme = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

        if (storedTheme === 'dark' || (!storedTheme && prefersDark)) {
            document.documentElement.setAttribute('data-theme', 'dark');
            updateIcon('dark');
        }

        toggle.addEventListener('click', () => {
            const current = document.documentElement.getAttribute('data-theme');
            const next = current === 'dark' ? 'light' : 'dark';

            document.documentElement.setAttribute('data-theme', next);
            localStorage.setItem('theme', next);
            updateIcon(next);
        });
    }

    function updateIcon(theme) {
        const toggle = document.getElementById('themeToggle');
        if (theme === 'dark') {
            toggle.innerHTML = GLOBAL_SVGS.THEME_LIGHT; // In dark mode, show light icon (sun) to switch to light
        } else {
            toggle.innerHTML = GLOBAL_SVGS.THEME_DARK; // In light mode, show dark icon (moon) to switch to dark
        }
    }

    // Run immediately to prevent layout shift
    injectNav();
})();
