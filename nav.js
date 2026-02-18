// Navigation script loaded synchronously

(function () {
    const config = window.DEEPLINK_CONFIG;
    if (!config) return console.error('DEEPLINK_CONFIG not found');

    function injectNav() {
        // Don't inject if already exists
        if (document.querySelector('.global-nav')) return;

        const navLinksHTML = config.tools.map(tool => `
            <a href="${config.resolvePath(tool.path)}" class="global-nav__link" data-path="${tool.id}">${tool.name}</a>
        `).join('');

        const navHTML = `
            <nav class="global-nav">
                <div class="global-nav__content">
                    <a href="${config.resolvePath('')}" class="global-nav__logo">
                        <span class="global-nav__logo-emoji">⚡️</span>
                        <span class="global-nav__brand">
                            <span class="global-nav__brand-title">Deeplink Tools</span>
                            <span class="global-nav__brand-subtitle">Essential utilities for mobile deep linking development</span>
                        </span>
                    </a>
                    <div class="global-nav__right">
                        <div class="global-nav__links">
                            ${navLinksHTML}
                        </div>
                        <button class="global-nav__theme-btn" id="themeToggle" aria-label="Toggle Theme">
                            ${GLOBAL_SVGS.THEME_LIGHT}
                        </button>
                        <button class="global-nav__menu-btn" id="menuToggle" aria-label="Open Menu">
                            ${GLOBAL_SVGS.MENU}
                        </button>
                    </div>
                </div>
            </nav>
        `;

        // Inject Nav
        document.body.insertAdjacentHTML('afterbegin', navHTML);

        injectDrawer();
        highlightActiveLink();
        initTheme();

        const menuToggle = document.getElementById('menuToggle');
        if (menuToggle) menuToggle.addEventListener('click', () => toggleDrawer(true));
    }

    function injectDrawer() {
        if (document.querySelector('.mobile-drawer')) return;

        const currentPath = window.location.pathname;
        const itemsHTML = config.tools.map(tool => {
            const isActive = currentPath.includes('/' + tool.path);
            return `
                <a href="${config.resolvePath(tool.path)}" class="mobile-drawer__item ${isActive ? 'is-active' : ''}">
                    <div class="mobile-drawer__item-emoji">${tool.emoji || '🛠️'}</div>
                    <div class="mobile-drawer__item-info">
                        <div class="mobile-drawer__item-name">${tool.name}</div>
                    </div>
                </a>
            `;
        }).join('');

        const drawerHTML = `
            <div class="mobile-drawer" id="mobileDrawer">
                <div class="mobile-drawer__backdrop" id="drawerBackdrop"></div>
                <div class="mobile-drawer__content">
                    <div class="mobile-drawer__header">
                        <div class="mobile-drawer__title">Deeplink Tools</div>
                        <button class="mobile-drawer__close" id="drawerClose" aria-label="Close Menu">
                            ${GLOBAL_SVGS.CLOSE}
                        </button>
                    </div>
                    <div class="mobile-drawer__list">
                        ${itemsHTML}
                    </div>
                    <div class="mobile-drawer__footer">
                        <button class="mobile-drawer__theme-btn" id="drawerThemeToggle" aria-label="Toggle Theme">
                            ${GLOBAL_SVGS.THEME_LIGHT}
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', drawerHTML);

        document.getElementById('drawerClose').addEventListener('click', () => toggleDrawer(false));
        document.getElementById('drawerBackdrop').addEventListener('click', () => toggleDrawer(false));
    }

    function toggleDrawer(open) {
        const drawer = document.getElementById('mobileDrawer');
        if (!drawer) return;

        drawer.classList.toggle('is-open', open);
        document.body.classList.toggle('drawer-open', open);
    }

    function highlightActiveLink() {
        const path = window.location.pathname;
        let activeKey = '';

        config.tools.forEach(tool => {
            if (path.includes('/' + tool.path)) activeKey = tool.id;
        });

        if (activeKey) {
            const link = document.querySelector(`.global-nav__link[data-path="${activeKey}"]`);
            if (link) link.classList.add('is-active');
        }
    }

    function initTheme() {
        // Check stored preference
        const storedTheme = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

        if (storedTheme === 'dark' || (!storedTheme && prefersDark)) {
            document.documentElement.setAttribute('data-theme', 'dark');
            updateIcons('dark');
        } else {
            updateIcons('light');
        }

        // Add listeners to all theme buttons
        document.body.addEventListener('click', (e) => {
            const toggle = e.target.closest('#themeToggle') || e.target.closest('#drawerThemeToggle');
            if (toggle) {
                const current = document.documentElement.getAttribute('data-theme');
                const next = current === 'dark' ? 'light' : 'dark';

                document.documentElement.setAttribute('data-theme', next);
                localStorage.setItem('theme', next);
                updateIcons(next);
            }
        });
    }

    function updateIcons(theme) {
        const toggles = [
            document.getElementById('themeToggle'),
            document.getElementById('drawerThemeToggle')
        ];

        toggles.forEach(toggle => {
            if (!toggle) return;
            if (theme === 'dark') {
                toggle.innerHTML = GLOBAL_SVGS.THEME_LIGHT; // Show sun to switch to light
            } else {
                toggle.innerHTML = GLOBAL_SVGS.THEME_DARK; // Show moon to switch to dark
            }
        });
    }

    // Run immediately to prevent layout shift
    injectNav();
})();
