export const DOM = {
    validateBtn: document.getElementById('validateBtn'),
    domainInput: document.getElementById('domainInput'),
    prefixInput: document.getElementById('prefixInput'),
    bundleInput: document.getElementById('bundleInput'),
    packageInput: document.getElementById('packageInput'),
    resultArea: document.getElementById('resultArea'),
};

export const renderLoading = (domain) => {
    DOM.resultArea.classList.remove('hidden');
    DOM.resultArea.innerHTML = `
        <div class="loading-state">
            <div class="spinner"></div>
            <p>Scanning <strong>${domain}</strong> for Deep Link files...</p>
        </div>
    `;
};

export const renderError = (message, url) => `
    <div class="check-item is-error">
        <strong>❌ Could not fetch file:</strong><br>
        <span style="font-size: 0.85rem;">URL: <a href="${url}" target="_blank">${url}</a></span>
    </div>
`;

export const buildCommonHTML = (checks) => {
    let html = `
        <div class="platform-header">
            <span class="platform-icon">🌐</span>
            <span>Common Connectivity & DNS</span>
        </div>
        <div class="checklist common-checklist">
    `;

    checks.forEach(check => {
        html += `
            <div class="check-item ${check.error ? 'is-error' : (check.warning ? 'is-warning' : '')}">
                <div class="check-header">
                    <strong>${check.error ? '❌' : (check.warning ? '⚠️' : '✅')} ${check.title}</strong>
                </div>
                <div class="check-body">${check.text}</div>
            </div>
        `;
    });
    html += '</div>';
    return html;
};

export const buildResultHTML = (url, checks, extractedApps, platform, filterId) => {
    let html = `
        <div class="platform-header">
            <span class="platform-icon">${platform === 'iOS' ? '🍎' : '🤖'}</span>
            <span>${platform} Validation</span>
        </div>
        <div class="checklist">
    `;

    checks.forEach(check => {
        html += `
            <div class="check-item ${check.error ? 'is-error' : (check.warning ? 'is-warning' : '')}">
                <div class="check-header">
                    <strong>${check.error ? '❌' : (check.warning ? '⚠️' : '✅')} ${check.title}</strong>
                </div>
                <div class="check-body">${check.text}</div>
            </div>
        `;
    });
    html += '</div>';

    if (Object.keys(extractedApps).length > 0) {
        let filteredAppsHTML = '';
        let foundAny = false;

        for (const [id, children] of Object.entries(extractedApps)) {
            const childList = Array.from(children);
            const filteredChildren = filterId ? childList.filter(c => c.toLowerCase().includes(filterId.toLowerCase())) : childList;

            if (filteredChildren.length > 0) {
                foundAny = true;
                filteredAppsHTML += `
                    <div class="team-group">
                        <div class="team-id-label">• ${id}</div>
                        <ul class="bundle-id-list">
                `;
                filteredChildren.forEach(child => {
                    filteredAppsHTML += `<li class="bundle-id-item"><span class="bundle-id-tag">${child}</span></li>`;
                });
                filteredAppsHTML += `</ul></div>`;
            }
        }

        if (foundAny) {
            html += `
                <div class="app-extraction-section">
                    <div class="extraction-title"><span>❓</span> Manually verify ${platform === 'iOS' ? 'IDs' : 'Packages'}:</div>
                    ${filteredAppsHTML}
                </div>
            `;
        } else if (filterId) {
            html += `
                <div class="app-extraction-section">
                    <div class="extraction-title" style="color: var(--error)"><span>❌</span> No matches for "${filterId}".</div>
                </div>
            `;
        }
    }

    return html;
};

export const buildRawJSONSection = (ios, android) => {
    let html = `
        <div class="raw-json-container" style="margin-top: 48px; border-top: 0px solid var(--border); padding-top: 32px;">
            <div class="platform-header">
                <span class="platform-icon">📄</span>
                <span>Raw Source Files</span>
            </div>
            <div class="results-grid">
    `;

    // iOS JSON
    html += `<div class="platform-column">
                <div style="margin-bottom: 8px; font-weight: 600; font-size: 0.9rem;">apple-app-site-association</div>
                <button class="copy-btn" data-target="ios-json">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                    Copy
                </button>
                <textarea id="ios-json" class="json-textarea" readonly style="height: 250px;">${JSON.stringify(ios?.json || {}, null, 2)}</textarea>
             </div>`;

    // Android JSON
    html += `<div class="platform-column">
                <div style="margin-bottom: 8px; font-weight: 600; font-size: 0.9rem;">assetlinks.json</div>
                <button class="copy-btn" data-target="android-json">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                    Copy
                </button>
                <textarea id="android-json" class="json-textarea" readonly style="height: 250px;">${JSON.stringify(android?.json || {}, null, 2)}</textarea>
             </div>`;

    html += `</div></div>`;
    return html;
};
