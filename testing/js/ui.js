import { DOM, SVGS, MAX_LINKS } from './constants.js';
import { state, updateState } from './state.js';
import { validateLink, autosizeTextarea, isDesktop, trackEvent } from './utils.js';
import { openQrModal } from './qr.js';

export const addLinkRow = (prefill = "", index = -1) => {
    if (getRows().length >= MAX_LINKS) return setStatus(`Max ${MAX_LINKS} links.`, "Error", "error");

    const row = document.createElement("div");
    row.className = "link-row";
    row.innerHTML = `
    <div class="link-index" aria-hidden="true"></div>
    <span class="drag-hint" aria-hidden="true">${SVGS.DRAG}</span>
    <div class="input-wrap">
      <textarea class="link-url" rows="1" placeholder="myapp://path" autocomplete="off" draggable="false">${prefill}</textarea>
      <span class="link-indicator" aria-hidden="true"></span>
    </div>
    <button class="link-remove icon-btn" type="button" aria-label="Remove">${SVGS.REMOVE}</button>
    <p class="link-error" aria-live="polite"></p>
  `;

    const list = DOM.linksList();
    const rows = getRows();

    if (index >= 0 && index < rows.length) {
        list.insertBefore(row, rows[index]);
    } else {
        list.appendChild(row);
    }

    const inputEl = row.querySelector(".link-url");
    autosizeTextarea(inputEl);
    if (prefill) {
        updateValidationState(inputEl);
        lockIfValid(inputEl);
        updateState('hadInputValue', true);
    }
    refreshUI();
    inputEl.focus();
};

export const renderIcons = (container = document) => {
    container.querySelectorAll("[data-icon]").forEach(el => {
        const iconName = el.dataset.icon;
        if (SVGS[iconName]) {
            el.innerHTML = SVGS[iconName];
        }
    });
};


export const setStatus = (text, emphasis = "", statusState = "idle") => {
    const statusEl = DOM.status();
    statusEl.classList.remove("status--ready", "status--error", "status--working");
    if (statusState) statusEl.classList.add(`status--${statusState}`);
    statusEl.innerHTML = emphasis ? `<strong>${emphasis}</strong> ${text}` : text;
    if (statusState !== "error") {
        updateState('lastNonErrorStatus', { text, emphasis, state: statusState });
    }
};

export const getLinkInputs = () => Array.from(DOM.linksList().querySelectorAll(".link-url"));
export const getRows = () => Array.from(DOM.linksList().querySelectorAll(".link-row"));

export const setLockState = (inputEl, locked) => {
    const row = inputEl.closest(".link-row");
    if (!row) return;
    inputEl.readOnly = locked;
    inputEl.classList.toggle("is-locked", locked);
    row.classList.toggle("is-locked", locked);
};

export const updateStatusInvalidSummary = () => {
    const rows = getRows();
    const invalid = [];
    rows.forEach((row, index) => {
        const inputEl = row.querySelector(".link-url");
        if (!inputEl) return;
        const value = inputEl.value.trim();
        if (value.length > 0 && !validateLink(value).ok) {
            invalid.push(index + 1);
        }
    });

    if (invalid.length === 0) {
        const s = state.lastNonErrorStatus;
        setStatus(s.text, s.emphasis, s.state);
        return;
    }
    setStatus(`Invalid links: ${invalid.join(", ")}`, "Error", "error");
};

export const updateValidationState = (inputEl) => {
    const row = inputEl.closest(".link-row");
    if (!row) return;
    const value = inputEl.value.trim();
    const validation = validateLink(value);
    const valid = value.length > 0 && validation.ok;

    row.classList.toggle("is-valid", valid);
    row.classList.toggle("is-invalid", value.length > 0 && !valid);

    const indicator = row.querySelector(".link-indicator");
    if (indicator) {
        indicator.dataset.state = value.length === 0 ? "" : (valid ? "valid" : "invalid");
    }

    const errorEl = row.querySelector(".link-error");
    if (errorEl) {
        errorEl.textContent = (value.length > 0 && !valid) ? "Invalid link format. Use http(s) or a valid URI scheme." : "";
    }

    if (!valid) setLockState(inputEl, false);
    updateStatusInvalidSummary();
};

export const refreshUI = () => {
    const rows = getRows();
    const inputs = getLinkInputs();
    const hasAnyValue = inputs.some(i => i.value.trim().length > 0);
    const editMode = state.editMode;

    // Update Multi-link state
    const isMulti = rows.length > 1;
    DOM.linksList().classList.toggle("is-multi", isMulti);
    if (DOM.field()) DOM.field().classList.toggle("is-multi", isMulti);

    // Update Link Numbers & Reorder state
    const canReorder = editMode && isMulti;
    DOM.linksList().classList.toggle("is-reorder", canReorder);
    rows.forEach((row, index) => {
        row.dataset.index = String(index);
        const indexEl = row.querySelector(".link-index");
        if (indexEl) indexEl.textContent = `Link ${index + 1}`;
        const inputEl = row.querySelector(".link-url");
        if (inputEl) {
            inputEl.id = `deeplink-${index}`;
            inputEl.setAttribute("aria-label", `Deeplink ${index + 1}`);
        }
    });

    // Update Remove Buttons visibility
    rows.forEach(row => {
        const removeBtn = row.querySelector(".link-remove");
        if (removeBtn) {
            removeBtn.disabled = !editMode;
            removeBtn.classList.toggle("is-hidden", !editMode);
        }
    });

    // Page Edit Button
    const editBtn = DOM.pageEditBtn();
    if (editBtn) {
        editBtn.style.display = (editMode || hasAnyValue) ? "inline-flex" : "none";
        editBtn.dataset.icon = editMode ? "UPDATE" : "EDIT";
        editBtn.setAttribute("aria-label", editMode ? "Update" : "Edit");
        renderIcons(editBtn.parentElement);
    }

    // Forward Share Button
    const forwardBtn = DOM.forwardShareBtn();
    if (forwardBtn) forwardBtn.style.display = hasAnyValue ? "inline-flex" : "none";

    // General Field state
    const field = DOM.field();
    if (field) field.classList.toggle("is-view", !editMode);

    const addRowBtn = DOM.addRow();
    if (addRowBtn) addRowBtn.style.display = editMode ? "" : "none";

    if (!editMode) {
        inputs.forEach(inputEl => lockIfValid(inputEl));
    } else {
        inputs.forEach(inputEl => setLockState(inputEl, false));
    }

    updateStatusInvalidSummary();
};


export const removeRow = (row) => {
    const rows = getRows();
    const index = rows.indexOf(row);
    const value = row.querySelector(".link-url")?.value || "";

    if (rows.length <= 1) {
        const inputEl = row.querySelector(".link-url");
        if (inputEl) {
            // Save to undo if it had value
            if (value.trim()) {
                state.undoStack.push({ value: value.trim(), index: 0 });
            }
            inputEl.value = "";
            setLockState(inputEl, false);
            updateValidationState(inputEl);
            autosizeTextarea(inputEl);
        }
        return;
    }

    // Save to undo stack
    if (value.trim()) {
        state.undoStack.push({ value: value.trim(), index });
    }

    row.remove();
    if (!getLinkInputs().some(i => i.value.trim().length > 0)) {
        updateState('hadInputValue', false);
    }
    refreshUI();
};

export const undoDeletion = () => {
    if (!state.undoStack.length) return;
    if (!state.editMode) return;

    const last = state.undoStack.pop();
    addLinkRow(last.value, last.index);
    setStatus("Restored deleted link.", "Undo", "ready");
};

export const openLink = (inputEl) => {
    const value = inputEl.value.trim();
    if (!value) {
        setStatus("Please enter a link or URI scheme.", "Error", "error");
        inputEl.focus();
        return;
    }

    const validation = validateLink(value);
    if (!validation.ok) {
        setStatus("Format should be a URL (http/https) or a URI scheme like myapp://.", "Error", "error");
        inputEl.focus();
        return;
    }

    trackEvent("testing_link_click", { type: validation.type });
    const row = inputEl.closest(".link-row");
    const index = row ? Number(row.dataset.index || "0") : 0;
    const label = `Link ${index + 1}`;

    setStatus(`Attempting to open (${validation.type}): <span>${value}</span>`, "Working", "working");

    if (isDesktop("(min-width: 700px)")) {
        openQrModal(value, `Scan ${label}`, `${label}: ${value}`, setStatus);
        return;
    }

    try {
        window.location.href = value;
    } catch {
        setStatus("This link could not be opened by the browser.", "Error", "error");
    }
};

export const lockIfValid = (inputEl) => {
    if (state.editMode) return;
    const val = inputEl.value.trim();
    if (val && validateLink(val).ok) {
        setLockState(inputEl, true);
        updateValidationState(inputEl);
        autosizeTextarea(inputEl);
    }
};

