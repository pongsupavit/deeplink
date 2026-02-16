import { DOM, SVGS, MAX_LINKS } from './constants.js';
import { state, updateState } from './state.js';
import { trackEvent, autosizeTextarea, getPreferredTheme, applyTheme, validateLink, getSystemTheme } from './utils.js';
import { setStatus, refreshUI, getLinkInputs, getRows, updateValidationState, lockIfValid, openLink, removeRow, renderIcons, addLinkRow, undoDeletion } from './ui.js';
import { closeQrModal, downloadQrCode } from './qr.js';

// --- Core Actions ---


const handleShare = async () => {
    const values = getLinkInputs().map(i => i.value.trim()).filter(v => v.length > 0);
    if (!values.length) return setStatus("Enter a link first.", "Error", "error");
    if (values.some(v => !validateLink(v).ok)) return setStatus("Invalid link format.", "Error", "error");

    const url = new URL(window.location.href);
    url.search = "";
    values.forEach((v, i) => url.searchParams.set(`link${i + 1}`, v));

    try {
        trackEvent("testing_page_share");
        await navigator.clipboard.writeText(url.toString());
        if (navigator.share && !window.matchMedia("(min-width: 700px)").matches) {
            await navigator.share({ url: url.toString() }).catch(e => { if (e.name !== 'AbortError') throw e; });
        }
        setStatus("URL copied to clipboard.", "Ready", "ready");
    } catch (e) {
        setStatus("Clipboard access failed.", "Error", "error");
    }
};

const toggleEditMode = () => {
    if (state.editMode) {
        const inputs = getLinkInputs();
        if (inputs.some(i => i.value.trim().length > 0 && !validateLink(i.value.trim()).ok)) return;

        const rows = getRows();

        // Find the index of the last row that has content
        let lastNonEmptyIndex = -1;
        rows.forEach((row, i) => {
            if (row.querySelector(".link-url")?.value.trim()) {
                lastNonEmptyIndex = i;
            }
        });

        // Identify blocking empty rows (those before the last contentful row)
        const blockingEmptyIndices = [];
        rows.forEach((row, i) => {
            if (i < lastNonEmptyIndex && !row.querySelector(".link-url")?.value.trim()) {
                blockingEmptyIndices.push(i + 1);
            }
        });

        if (blockingEmptyIndices.length > 0) {
            return setStatus(`Please fill or remove empty rows in the middle: Link ${blockingEmptyIndices.join(", ")}`, "Notice", "error");
        }

        // Clean up trailing empty rows
        rows.forEach((row, i) => {
            if (i > lastNonEmptyIndex) row.remove();
        });

        const finalInputs = getLinkInputs();
        const values = finalInputs.map(i => i.value.trim());

        if (values.length === 0) {
            updateState('editMode', true);
            if (getRows().length === 0) addLinkRow();
            return setStatus("Enter a link to test.", "", "idle");
        }

        const url = new URL(window.location.href);
        url.search = "";
        values.forEach((v, i) => url.searchParams.set(`link${i + 1}`, v));
        window.history.replaceState({}, "", url.toString());

        setStatus("Updated.", "Ready", "ready");
        trackEvent("testing_link_save", { count: values.length });
        updateState('editMode', false);
    } else {
        updateState('editMode', true);
    }
    refreshUI();
};

// --- Initialization ---
const init = () => {
    const url = new URL(window.location.href);
    const links = [];
    for (let i = 1; i <= MAX_LINKS; i++) {
        const v = url.searchParams.get(`link${i}`);
        if (v) links.push(v);
    }

    if (links.length) {
        links.forEach(link => addLinkRow(link));
        updateState('editMode', false);
        setStatus("Link is prefilled, please click the blue button to test deeplink", "Ready", "ready");
    } else {
        updateState('editMode', true);
        addLinkRow();
    }

    applyTheme(getPreferredTheme());
    renderIcons();
    refreshUI();

    // Final focus check for empty state
    if (!links.length) {
        const first = getLinkInputs()[0];
        if (first) first.focus();
    }
};


// --- Event Listeners (Delegated) ---
DOM.linksList().addEventListener("input", e => {
    if (e.target.classList.contains("link-url")) {
        updateValidationState(e.target);
        autosizeTextarea(e.target);
        refreshUI();
    }
});

DOM.linksList().addEventListener("click", e => {
    const row = e.target.closest(".link-row");
    if (!row) return;

    if (e.target.closest(".link-remove")) return removeRow(row);

    const inputEl = row.querySelector(".link-url");
    if (!state.editMode && inputEl.classList.contains("is-locked")) openLink(inputEl);
});

DOM.linksList().addEventListener("keydown", e => {
    if (e.target.classList.contains("link-url") && e.key === "Enter") {
        e.preventDefault();
        if (state.editMode) toggleEditMode();
        else openLink(e.target);
    }
});

DOM.addLinkBtn().addEventListener("click", () => addLinkRow());
DOM.shareBtn()?.addEventListener("click", handleShare);
DOM.forwardShareBtn()?.addEventListener("click", handleShare);
DOM.pageEditBtn()?.addEventListener("click", toggleEditMode);
DOM.qrClose().addEventListener("click", closeQrModal);
DOM.qrBackdrop().addEventListener("click", closeQrModal);
DOM.themeOptions().forEach(btn => btn.addEventListener("click", () => {
    localStorage.setItem("theme", btn.dataset.theme);
    applyTheme(btn.dataset.theme);
}));
DOM.qrDownload().addEventListener("click", downloadQrCode);

window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    if (getPreferredTheme() === "auto") applyTheme("auto");
});

document.addEventListener("keydown", e => {
    if (e.key === "Escape") closeQrModal();

    // Check for Cmd+Z (Mac) or Ctrl+Z (Win)
    if ((e.metaKey || e.ctrlKey) && e.key === "z") {
        if (state.editMode) {
            e.preventDefault();
            undoDeletion();
        }
    }
});

// Reordering Logic
const getDragAfterElement = (y) => {
    return getRows().reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        return (offset < 0 && offset > closest.offset) ? { offset, element: child } : closest;
    }, { offset: Number.NEGATIVE_INFINITY }).element;
};

DOM.linksList().addEventListener("pointerdown", e => {
    if (!state.editMode || !DOM.linksList().classList.contains("is-reorder") || e.target.closest("button")) return;
    const row = e.target.closest(".link-row");
    if (!row) return;

    updateState('pointerActive', true);
    updateState('dragPending', { row });
    updateState('dragStartY', e.clientY);
    if (DOM.linksList().setPointerCapture) DOM.linksList().setPointerCapture(e.pointerId);
});

DOM.linksList().addEventListener("pointermove", e => {
    if (!state.pointerActive) return;
    if (state.dragPending && !state.draggingRow) {
        if (Math.abs(e.clientY - state.dragStartY) < 6) return;
        updateState('draggingRow', state.dragPending.row);
        state.draggingRow.classList.add("is-dragging");
        document.body.classList.add("is-reordering");
    }
    if (state.draggingRow) {
        const after = getDragAfterElement(e.clientY);
        if (after) DOM.linksList().insertBefore(state.draggingRow, after);
        else DOM.linksList().appendChild(state.draggingRow);
    }
});

const endDrag = () => {
    if (state.draggingRow) state.draggingRow.classList.remove("is-dragging");
    updateState('draggingRow', null);
    updateState('dragPending', null);
    updateState('pointerActive', false);
    document.body.classList.remove("is-reordering");
    refreshUI();
};

DOM.linksList().addEventListener("pointerup", endDrag);
DOM.linksList().addEventListener("pointercancel", endDrag);

init();
