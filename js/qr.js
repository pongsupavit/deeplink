import { DOM } from './constants.js';
import { renderIcons } from './ui.js';

export const addQrPadding = (pad = 16) => {
    const canvasElement = DOM.qrCanvas();
    const img = canvasElement.querySelector("img");
    const canvas = canvasElement.querySelector("canvas");
    const source = canvas || img;
    if (!source) return;

    const draw = () => {
        const size = source.width || source.naturalWidth || 220;
        if (!size) return;
        const out = document.createElement("canvas");
        out.width = size + pad * 2;
        out.height = size + pad * 2;

        const ctx = out.getContext("2d");
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, out.width, out.height);
        ctx.drawImage(source, pad, pad, size, size);

        const paddedImg = document.createElement("img");
        paddedImg.alt = "QR code";
        paddedImg.src = out.toDataURL("image/png");

        canvasElement.innerHTML = "";
        canvasElement.appendChild(paddedImg);
    };

    if (img && !img.complete) {
        img.addEventListener("load", draw, { once: true });
        return;
    }

    requestAnimationFrame(draw);
};

export const openQrModal = async (value, title, displayText, setStatus) => {
    try {
        const qrModal = DOM.qrModal();
        const qrCanvas = DOM.qrCanvas();
        const qrTitle = DOM.qrTitle();
        const qrText = DOM.qrText();

        await window.QR_LIB.load();
        qrCanvas.innerHTML = "";
        window.QR_LIB.render(qrCanvas, value, { size: 220 });
        addQrPadding(16);
        if (qrTitle) qrTitle.textContent = title || "Scan to test";
        qrText.textContent = displayText || value;

        // Store metadata for download filename
        const downloadBtn = DOM.qrDownload();
        if (downloadBtn) {
            downloadBtn.dataset.title = title || "deeplink";
            downloadBtn.dataset.url = value || "";
        }

        renderIcons(qrModal);
        qrModal.classList.add("is-open");
        qrModal.setAttribute("aria-hidden", "false");
    } catch {
        setStatus("QR code library failed to load.", "Error", "error");
    }
};

export const closeQrModal = () => {
    const qrModal = DOM.qrModal();
    qrModal.classList.remove("is-open");
    qrModal.setAttribute("aria-hidden", "true");
};

export const downloadQrCode = async () => {
    const downloadBtn = DOM.qrDownload();
    if (!downloadBtn) return;

    const url = downloadBtn.dataset.url || "";
    const title = downloadBtn.dataset.title || "Link";

    // Create a high-res 1000x1000 QR code off-screen
    const targetSize = 1000;
    const padding = 60; // Clean margin for the 1000px version
    const qrSize = targetSize - (padding * 2);

    // Create a temporary container for high-res rendering
    const tempContainer = document.createElement("div");
    tempContainer.style.position = "absolute";
    tempContainer.style.left = "-9999px";
    document.body.appendChild(tempContainer);

    try {
        await window.QR_LIB.render(tempContainer, url, { size: qrSize });

        // Wait for potential internal canvas/img to be ready
        const source = tempContainer.querySelector("canvas") || tempContainer.querySelector("img");

        // Ensure source is loaded if it's an image
        if (source instanceof HTMLImageElement && !source.complete) {
            await new Promise(resolve => source.onload = resolve);
        }

        // Create the final 1000x1000 canvas
        const finalCanvas = document.createElement("canvas");
        finalCanvas.width = targetSize;
        finalCanvas.height = targetSize;
        const ctx = finalCanvas.getContext("2d");

        // Fill background
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, targetSize, targetSize);

        // Draw QR code with padding
        ctx.drawImage(source, padding, padding, qrSize, qrSize);

        // Filename Logic
        const linkMatch = title.match(/Link\s*(\d+)/i);
        const linkRef = linkMatch ? `Link-${linkMatch[1]}` : "Link";
        const cleanUrl = url.replace(/^https?:\/\//i, '')
            .replace(/[^a-z0-9]/gi, '-')
            .replace(/-+/g, '-')
            .substring(0, 30);
        const filename = `${linkRef}-${cleanUrl}.png`.replace(/-+\.png$/, '.png');

        // Trigger Download
        const downloadLink = document.createElement("a");
        downloadLink.href = finalCanvas.toDataURL("image/png");
        downloadLink.download = filename;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);

    } finally {
        document.body.removeChild(tempContainer);
    }
};

