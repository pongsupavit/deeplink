export const DOM = {
    validateBtn: document.getElementById('validateBtn'),
    domainInput: document.getElementById('domainInput'),
    prefixInput: document.getElementById('prefixInput'),
    bundleInput: document.getElementById('bundleInput'),
    packageInput: document.getElementById('packageInput'),
    resultArea: document.getElementById('resultArea'),
};

/**
 * Atomic Components (Functional Builders)
 */

const renderPlatformIcon = (platform) => {
    const icons = {
        'iOS': '🍎',
        'Android': '🤖',
        'Common': '🌐',
        'Source': '📄'
    };
    return `<span class="platform-icon">${icons[platform] || '🔍'}</span>`;
};

const renderBadge = (text, type = 'neutral') => `
    <span class="badge is-${type}">${text}</span>
`;

/**
 * Renders a single check result item
 */
const renderCheckItem = (check) => {
    let statusClass = 'is-success';
    let icon = '✅';

    if (check.error) {
        statusClass = 'is-error';
        icon = '❌';
    } else if (check.warning) {
        statusClass = 'is-warning';
        icon = '⚠️';
    } else if (check.isNeutral) {
        statusClass = 'is-neutral';
        icon = '⚪';
    }

    return `
        <div class="check-item ${statusClass}">
            <div class="check-header">
                <strong>${icon} ${check.title}</strong>
            </div>
            <div class="check-body">${check.text}</div>
        </div>
    `;
};

/**
 * Renders a platform header section
 */
const renderPlatformSectionHeader = (platform, title) => `
    <div class="platform-header">
        ${renderPlatformIcon(platform)}
        <span>${title || platform + ' Validation'}</span>
    </div>
`;

/**
 * Renders an app identifier tag (Bundle ID or Package)
 */
const renderAppTag = (id) => `
    <li class="bundle-id-item">
        <span class="bundle-id-tag">${id}</span>
    </li>
`;

/**
 * Main Exported Renderers
 */

export const renderLoading = (domain) => {
    DOM.resultArea.classList.remove('hidden');
    DOM.resultArea.innerHTML = `
        <div class="loading-state">
            <div class="spinner"></div>
            <p>Scanning <strong>${domain}</strong> for Deep Link files...</p>
        </div>
    `;
};

export const renderError = (message, url, isOptional = false) => {
    const isAccessDenied = message.includes('403') || message.toLowerCase().includes('access denied') || message.toLowerCase().includes('forbidden');
    const isNotFound = message.includes('404') || message.toLowerCase().includes('not found');

    const check = {
        title: isAccessDenied ? 'Access Denied (403)' : (isNotFound ? 'File Not Found' : 'Fetch Error'),
        text: isAccessDenied
            ? 'The server or a bot protection system (like Cloudflare) is blocking the validator. Please try testing on a real mobile device.'
            : `Error: ${message}<br><small class="url-hint">URL: <a href="${url}" target="_blank">${url}</a></small>`,
        error: !isOptional,
        isNeutral: isOptional && isNotFound
    };

    return renderCheckItem(check);
};

export const buildCommonHTML = (checks) => {
    let html = renderPlatformSectionHeader('Common', 'Common Connectivity & DNS');
    html += '<div class="checklist common-checklist">';
    checks.forEach(check => {
        html += renderCheckItem(check);
    });
    html += '</div>';
    return html;
};

export const buildResultHTML = (url, checks, extractedApps, platform, filterId) => {
    let html = '<div class="checklist">';
    checks.forEach(check => {
        html += renderCheckItem(check);
    });
    html += '</div>';

    if (Object.keys(extractedApps).length > 0) {
        let filteredAppsHTML = '';
        let foundAny = false;

        for (const [id, children] of Object.entries(extractedApps)) {
            const childList = Array.from(children);
            const filteredChildren = filterId
                ? childList.filter(c => c.toLowerCase().includes(filterId.toLowerCase()))
                : childList;

            if (filteredChildren.length > 0) {
                foundAny = true;
                filteredAppsHTML += `
                    <div class="team-group">
                        <div class="team-id-label">• ${id}</div>
                        <ul class="bundle-id-list">
                            ${filteredChildren.map(child => renderAppTag(child)).join('')}
                        </ul>
                    </div>
                `;
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
                    <div class="extraction-title is-error-text"><span>❌</span> No matches for "${filterId}".</div>
                </div>
            `;
        }
    }

    return html;
};

export const buildRawJSONSection = (ios, android) => {
    const renderJSONBox = (title, id, json) => `
        <div class="platform-column">
            <div class="json-header-label">${title}</div>
            <button class="copy-btn" data-target="${id}">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                Copy
            </button>
            <textarea id="${id}" class="json-textarea" readonly>${JSON.stringify(json || {}, null, 2)}</textarea>
        </div>
    `;

    return `
        <div class="raw-json-container">
            ${renderPlatformSectionHeader('Source', 'Raw Source Files')}
            <div class="results-grid">
                ${ios && !ios.error ? renderJSONBox('apple-app-site-association', 'ios-json', ios.json) : ''}
                ${android && !android.error ? renderJSONBox('assetlinks.json', 'android-json', android.json) : ''}
            </div>
        </div>
    `;
};
