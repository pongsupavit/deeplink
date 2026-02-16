export const analyzeCommon = (dnsResult, domain, iosMeta, androidMeta) => {
    const results = [];

    // 1. DNS Validation
    if (dnsResult.success) {
        results.push({
            title: 'DNS Validation Passed',
            text: `Domain is valid and reachable<br>
                   <div style="font-size: 0.8rem; margin-top: 12px; color: var(--muted);">
                     - Domain: ${domain}<br>
                     - IP Address: ${dnsResult.ip}<br>
                     - Response Time: ${dnsResult.duration}ms
                   </div>`,
            error: false
        });
    } else {
        results.push({
            title: 'DNS Validation Failed',
            text: `Domain is invalid or unreachable<br>
                   <div style="font-size: 0.8rem; margin-top: 12px; line-height: 1.5;">
                     <strong style="color: var(--error);">Reason:</strong> ${dnsResult.error}<br><br>
                     <strong>How to Fix:</strong><br>
                     <ul style="margin: 4px 0; padding-left: 18px;">
                       <li>Verify domain name spelling</li>
                       <li>Check DNS records (A/CNAME)</li>
                       <li>Ensure domain is publicly accessible</li>
                       <li>Wait for DNS propagation (up to 48h)</li>
                     </ul>
                   </div>`,
            error: true
        });
    }

    // 2. HTTPS (Common)
    // If either is fetched, it's via HTTPS in our proxy racing logic usually. 
    // But we can check results if they were successful.
    const iosFetched = iosMeta && !iosMeta.error;
    const androidFetched = androidMeta && !androidMeta.error;

    if (iosFetched || androidFetched) {
        results.push({
            title: 'HTTPS Connection',
            text: `Domain supports secure HTTPS connections. Required by both Apple and Google for auto-verification.<br>
                   <div style="margin-top: 4px;">
                     <a href="https://developer.apple.com/documentation/xcode/supporting-associated-domains#:~:text=You%20must%20host%20the%20file%20using%20https" target="_blank" style="font-size: 0.75rem; color: var(--muted); text-decoration: underline; margin-right: 12px;">Apple Reference</a>
                     <a href="https://developer.android.com/training/app-links/verify-applinks#auto-verification" target="_blank" style="font-size: 0.75rem; color: var(--muted); text-decoration: underline;">Android Reference</a>
                   </div>`,
            error: false
        });

        // 3. Redirects
        const iosRedir = iosMeta?.redirected;
        const androidRedir = androidMeta?.redirected;
        const anyRedir = iosRedir || androidRedir;

        results.push({
            title: 'No Redirects',
            text: (anyRedir
                ? `Warning: Redirects detected. Apple and Google require serving these files directly.`
                : `Deep link files are served directly without redirects. Required by both Apple and Google.`) +
                `<div style="margin-top: 4px;">
                     <a href="https://developer.apple.com/documentation/xcode/supporting-associated-domains#:~:text=with%20no%20redirects" target="_blank" style="font-size: 0.75rem; color: var(--muted); text-decoration: underline; margin-right: 12px;">Apple Reference</a>
                     <a href="https://developer.android.com/training/app-links/verify-applinks#auto-verification" target="_blank" style="font-size: 0.75rem; color: var(--muted); text-decoration: underline;">Android Reference</a>
                   </div>`,
            warning: anyRedir
        });
    }

    return results;
};

export const analyzeIOS = (json, appPrefix, bundleId, meta, url) => {
    const results = [];

    results.push({
        title: 'AASA File is Found',
        text: `Successfully reached file: <a href="${url}" target="_blank" style="color: var(--accent); text-decoration: none;">${url}</a>`,
        error: false
    });

    const validMimes = ['application/json', 'application/pkcs7-mime', 'text/plain'];
    const isMimeValid = validMimes.some(m => meta.contentType?.includes(m));

    results.push({
        title: 'MIME Type',
        text: `Content-Type: <code>${meta.contentType || 'unknown'}</code>. Apple prefers application/json.`,
        error: !isMimeValid && meta.contentType !== 'unknown',
        warning: meta.contentType === 'unknown'
    });

    const hasAppLinks = !!json.applinks;
    results.push({ title: 'Universal Links (applinks)', text: hasAppLinks ? 'Found applinks section.' : 'Missing applinks section.', error: !hasAppLinks });

    const isNewFormat = json.applinks?.details && Array.isArray(json.applinks.details);
    results.push({ title: 'AASA Format', text: isNewFormat ? 'Using modern format (iOS 13+).' : 'Using legacy format.', warning: !isNewFormat });

    if (appPrefix && bundleId) {
        const targetId = `${appPrefix}.${bundleId}`;
        const details = json.applinks?.details || [];
        const appIDs = details.map(d => [d.appID, d.appIDs]).flat(2).filter(Boolean);
        const isMatch = appIDs.includes(targetId);
        results.push({ title: 'App ID Match', text: isMatch ? `Matched App ID: ${targetId}` : `Mismatch: ${targetId} not found.`, error: !isMatch });
    }

    return results;
};

export const analyzeAndroid = (json, packageName, meta, url) => {
    const results = [];

    results.push({
        title: 'Asset Links is Found',
        text: `Successfully reached file: <a href="${url}" target="_blank" style="color: var(--accent); text-decoration: none;">${url}</a>`,
        error: false
    });

    results.push({ title: 'MIME Type', text: `Header: <code>${meta.contentType}</code>. Google requires application/json.`, warning: !meta.contentType?.includes('application/json') });
    results.push({ title: 'Valid JSON', text: 'Successfully parsed.', error: false });

    const hasAssetLinks = Array.isArray(json) && json.some(item => item.relation && item.target);
    results.push({ title: 'Asset Links Format', text: hasAssetLinks ? 'Valid structure.' : 'Invalid format.', error: !hasAssetLinks });

    if (packageName) {
        const found = json.some(item => item.target?.package_name === packageName);
        results.push({ title: 'Package Match', text: found ? `Found package ${packageName}.` : `Could not find package ${packageName}.`, error: !found });
    }

    return results;
};

export const extractIOSApps = (json) => {
    const apps = {};
    const details = json.applinks?.details || [];
    details.forEach(d => {
        const ids = [d.appID, d.appIDs].flat().filter(Boolean);
        ids.forEach(id => {
            const [team, ...bundle] = id.split('.');
            if (!apps[team]) apps[team] = new Set();
            apps[team].add(bundle.join('.'));
        });
    });
    return apps;
};

export const extractAndroidApps = (json) => {
    const apps = {};
    if (!Array.isArray(json)) return apps;
    json.forEach(item => {
        const pkg = item.target?.package_name;
        const certs = item.target?.sha256_cert_fingerprints || [];
        if (pkg) {
            if (!apps[pkg]) apps[pkg] = new Set();
            certs.forEach(c => apps[pkg].add(c));
        }
    });
    return apps;
};
