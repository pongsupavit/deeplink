(function () {
    function injectFooter() {
        // Don't inject if already exists
        if (document.querySelector('.global-footer')) return;

        const footerHTML = `
            <footer class="global-footer">
                <div class="global-footer__content">
                    <p>Developed by <a href="https://github.com/pongsupavit" target="_blank" rel="noopener noreferrer">Pongsupavit</a></p>
                </div>
            </footer>
        `;

        // Inject Footer at the end of the body
        document.body.insertAdjacentHTML('beforeend', footerHTML);
    }

    // Run when DOM is ready to ensure footer is injected at the very bottom of the body
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', injectFooter);
    } else {
        injectFooter();
    }
})();
