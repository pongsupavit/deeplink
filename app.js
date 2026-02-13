const input = document.getElementById("deeplink-0");
const shareBtn = document.getElementById("shareBtn");
const addLinkBtn = document.getElementById("addLinkBtn");
const linksList = document.getElementById("linksList");
const addRow = document.querySelector(".add-row");
const field = document.querySelector(".field");
const themeOptions = Array.from(document.querySelectorAll(".theme-option"));
const forwardShareBtn = document.getElementById("forwardShareBtn");
const pageEditBtn = document.getElementById("pageEditBtn");
const status = document.getElementById("status");
const qrModal = document.getElementById("qrModal");
const qrClose = document.getElementById("qrClose");
const qrCanvas = document.getElementById("qrCanvas");
const qrText = document.getElementById("qrText");
const qrBackdrop = document.querySelector(".qr-backdrop");
const qrTitle = document.getElementById("qrTitle");

const DESKTOP_QUERY = "(min-width: 700px)";
const MAX_LINKS = 10;

let hadInputValue = false;
let lastNonErrorStatus = { text: "Waiting for input.", emphasis: "", state: "idle" };
let editMode = true;

const EDIT_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor"><path d="M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z"/></svg>`;
const UPDATE_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor"><path d="M840-680v480q0 33-23.5 56.5T760-120H200q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h480l160 160Zm-80 34L646-760H200v560h560v-446ZM565-275q35-35 35-85t-35-85q-35-35-85-35t-85 35q-35 35-35 85t35 85q35 35 85 35t85-35ZM240-560h360v-160H240v160Zm-40-86v446-560 114Z"/></svg>`;
const REMOVE_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor"><path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z"/></svg>`;

const trackEvent = (name, params = {}) => {
  if (typeof window.gtag === "function") {
    window.gtag("event", name, params);
  }
};

const getLinkInputs = () => Array.from(linksList.querySelectorAll(".link-url"));
const getRows = () => Array.from(linksList.querySelectorAll(".link-row"));
let draggingRow = null;
let dropIndicator = null;
let dragPending = null;
let dragStartY = 0;
const hasPrefilled = new URL(window.location.href).searchParams.get("link1");

const autosizeTextarea = (inputEl) => {
  if (!inputEl || inputEl.tagName !== "TEXTAREA") return;
  inputEl.style.height = "auto";
  const next = Math.max(inputEl.scrollHeight, 40);
  inputEl.style.height = `${next}px`;
};

const enableMultiMode = () => {
  linksList.classList.add("is-multi");
  if (field) field.classList.add("is-multi");
};

const disableMultiMode = () => {
  linksList.classList.remove("is-multi");
  if (field) field.classList.remove("is-multi");
};

const getDragAfterElement = (container, y) => {
  const rows = getRows().filter((row) => row !== draggingRow);
  return rows.reduce(
    (closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      if (offset < 0 && offset > closest.offset) {
        return { offset, element: child };
      }
      return closest;
    },
    { offset: Number.NEGATIVE_INFINITY, element: null }
  ).element;
};

const updateLinkNumbers = () => {
  const rows = getRows();
  const canReorder = editMode && rows.length > 1;
  linksList.classList.toggle("is-reorder", canReorder);
  rows.forEach((row, index) => {
    row.dataset.index = String(index);
    row.setAttribute("draggable", "false");
    row.querySelectorAll(".link-index, .drag-hint, .input-wrap, .link-remove").forEach((el) => {
      el.setAttribute("draggable", "false");
    });
    const indexEl = row.querySelector(".link-index");
    if (indexEl) indexEl.textContent = `${index + 1}.`;
    const inputEl = row.querySelector(".link-url");
    if (inputEl) {
      inputEl.id = `deeplink-${index}`;
      inputEl.setAttribute("aria-label", `Deeplink ${index + 1}`);
      inputEl.setAttribute("draggable", "false");
    }
  });
};

const getErrorEl = (row) => row.querySelector(".link-error");
const getIndicatorEl = (row) => row.querySelector(".link-indicator");

const setLockState = (inputEl, locked) => {
  const row = inputEl.closest(".link-row");
  if (!row) return;
  if (locked) {
    inputEl.classList.add("is-locked");
    inputEl.readOnly = true;
    row.classList.add("is-locked");
  } else {
    inputEl.classList.remove("is-locked");
    inputEl.readOnly = false;
    row.classList.remove("is-locked");
  }
};

const getInvalidIndexes = () => {
  const rows = getRows();
  const invalid = [];
  rows.forEach((row, index) => {
    const inputEl = row.querySelector(".link-url");
    if (!inputEl) return;
    const value = inputEl.value.trim();
    if (value.length === 0) return;
    const ok = validateLink(value).ok;
    if (!ok) invalid.push(index + 1);
  });
  return invalid;
};

const getValuesWithIndexes = () =>
  getRows().map((row, index) => {
    const inputEl = row.querySelector(".link-url");
    return { index: index + 1, value: inputEl ? inputEl.value.trim() : "" };
  });

const getSaveBlockedIndexes = () => {
  const entries = getValuesWithIndexes();
  if (entries.length === 0) return [];
  const lastNonEmpty = entries
    .map((item) => (item.value.length > 0 ? item.index : null))
    .filter(Boolean)
    .pop();
  return entries
    .filter((item) => item.value.length === 0 && item.index !== lastNonEmpty && item.index !== entries.length)
    .map((item) => item.index);
};

const updateStatusInvalidSummary = () => {
  const invalid = getInvalidIndexes();
  if (invalid.length === 0) {
    setStatus(lastNonErrorStatus.text, lastNonErrorStatus.emphasis, lastNonErrorStatus.state);
    return;
  }
  setStatus(`Invalid links: ${invalid.join(", ")}`, "Error", "error");
};

const updateValidationState = (inputEl) => {
  const row = inputEl.closest(".link-row");
  if (!row) return;
  const value = inputEl.value.trim();
  const valid = value.length > 0 && validateLink(value).ok;
  row.classList.toggle("is-valid", valid);
  row.classList.toggle("is-invalid", value.length > 0 && !valid);
  const indicator = getIndicatorEl(row);
  if (indicator) {
    if (value.length === 0) {
      indicator.dataset.state = "";
    } else if (valid) {
      indicator.dataset.state = "valid";
    } else {
      indicator.dataset.state = "invalid";
    }
  }
  const errorEl = getErrorEl(row);
  if (errorEl) {
    if (value.length > 0 && !valid) {
      errorEl.textContent = "Invalid link format. Use http(s) or a valid URI scheme.";
    } else {
      errorEl.textContent = "";
    }
  }
  if (!valid) {
    setLockState(inputEl, false);
  }
  updateStatusInvalidSummary();
};

const lockIfValid = (inputEl) => {
  if (editMode) return;
  const value = inputEl.value.trim();
  if (!value) return;
  if (!validateLink(value).ok) return;
  setLockState(inputEl, true);
  updateValidationState(inputEl);
  autosizeTextarea(inputEl);
};

const updateRemoveButtons = () => {
  const rows = getRows();
  rows.forEach((row) => {
    const removeBtn = row.querySelector(".link-remove");
    if (!removeBtn) return;
    const disableRemove = !editMode;
    removeBtn.disabled = disableRemove;
    removeBtn.setAttribute("aria-disabled", disableRemove ? "true" : "false");
    removeBtn.classList.toggle("is-hidden", !editMode);
  });
};

const removeRow = (row) => {
  const rows = getRows();
  if (rows.length <= 1) {
    const inputEl = row.querySelector(".link-url");
    if (inputEl) {
      inputEl.value = "";
      setLockState(inputEl, false);
      updateValidationState(inputEl);
      autosizeTextarea(inputEl);
    }
    return;
  }
  row.remove();
  refreshUI();
  if (getRows().length <= 1) {
    disableMultiMode();
  }
  if (!getLinkInputs().some((item) => item.value.trim().length > 0)) {
    hadInputValue = false;
  }
  updateForwardVisibility();
};

const attachRowControls = (row, inputEl) => {
  const removeBtn = row.querySelector(".link-remove");
  if (removeBtn) {
    removeBtn.addEventListener("click", () => {
      if (removeBtn.disabled) return;
      removeRow(row);
    });
  }
};

const attachInputEvents = (inputEl) => {
  inputEl.addEventListener("input", () => {
    const hasValue = inputEl.value.trim().length > 0;
    if (hasValue && !hadInputValue) {
      trackEvent("ga_insert_link", { source: "typing" });
    }
    hadInputValue = hasValue;
    updateValidationState(inputEl);
    autosizeTextarea(inputEl);
    refreshUI();
  });

  inputEl.addEventListener("keydown", (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "z") {
      const row = inputEl.closest(".link-row");
      const isFirstRow = row && row.dataset.index === "0";
      if (!isFirstRow && inputEl.value.trim().length === 0) {
        event.preventDefault();
        removeRow(row);
      }
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      updateValidationState(inputEl);
      if (editMode) {
        if (pageEditBtn) pageEditBtn.click();
        return;
      }
      if (!editMode && inputEl.classList.contains("is-locked")) {
        openLink(inputEl);
      }
    }
  });

  inputEl.addEventListener("click", () => {
    if (!editMode && inputEl.classList.contains("is-locked")) {
      openLink(inputEl);
    }
  });

  inputEl.addEventListener("blur", () => {
    if (!editMode) return;
  });
};

const addLinkRow = (prefill = "") => {
  const currentRows = linksList.querySelectorAll(".link-row").length;
  if (currentRows >= MAX_LINKS) {
    setStatus(`You can add up to ${MAX_LINKS} links.`, "Error", "error");
    return;
  }

  enableMultiMode();
  const index = currentRows;
  const row = document.createElement("div");
  row.className = "link-row";
  row.dataset.index = String(index);
  row.setAttribute("draggable", "false");

  const indexBadge = document.createElement("div");
  indexBadge.className = "link-index";
  indexBadge.setAttribute("aria-hidden", "true");
  indexBadge.textContent = `${index + 1}.`;

  const dragHint = document.createElement("span");
  dragHint.className = "drag-hint";
  dragHint.setAttribute("aria-hidden", "true");
  dragHint.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor"><path d="M480-80 310-250l57-57 73 73v-206H235l73 72-58 58L80-480l169-169 57 57-72 72h206v-206l-73 73-57-57 170-170 170 170-57 57-73-73v206h205l-73-72 58-58 170 170-170 170-57-57 73-73H520v205l72-73 58 58L480-80Z"/></svg>`;

  const wrap = document.createElement("div");
  wrap.className = "input-wrap";

  const inputEl = document.createElement("textarea");
  inputEl.className = "link-url";
  inputEl.id = `deeplink-${index}`;
  inputEl.rows = 1;
  inputEl.placeholder = "myapp://path?foo=bar";
  inputEl.autocomplete = "off";
  inputEl.setAttribute("aria-label", `Deeplink ${index + 1}`);
  inputEl.value = prefill;
  inputEl.setAttribute("draggable", "false");

  const removeBtn = document.createElement("button");
  removeBtn.className = "link-remove icon-btn";
  removeBtn.type = "button";
  removeBtn.setAttribute("aria-label", "Remove link");
  removeBtn.innerHTML = REMOVE_ICON_SVG;

  const errorEl = document.createElement("p");
  errorEl.className = "link-error";
  errorEl.setAttribute("aria-live", "polite");

  wrap.appendChild(inputEl);
  const indicator = document.createElement("span");
  indicator.className = "link-indicator";
  indicator.setAttribute("aria-hidden", "true");
  wrap.appendChild(indicator);
  row.appendChild(indexBadge);
  row.appendChild(dragHint);
  row.appendChild(wrap);
  row.appendChild(removeBtn);
  row.appendChild(errorEl);
  linksList.appendChild(row);

  attachInputEvents(inputEl);
  attachRowControls(row, inputEl);
  updateValidationState(inputEl);
  lockIfValid(inputEl);
  autosizeTextarea(inputEl);
  refreshUI();
  inputEl.focus();
  if (prefill) hadInputValue = true;
  updateForwardVisibility();
};

const setStatus = (text, emphasis = "", state = "idle") => {
  status.classList.remove("status--ready", "status--error", "status--working");
  if (state) status.classList.add(`status--${state}`);
  status.innerHTML = emphasis ? `<strong>${emphasis}</strong> ${text}` : text;
  if (state !== "error") {
    lastNonErrorStatus = { text, emphasis, state };
  }
};

const setEditMode = (enabled) => {
  editMode = enabled;
  const rows = getRows();
  rows.forEach((row) => {
    const inputEl = row.querySelector(".link-url");
    if (!inputEl) return;
    if (enabled) {
      inputEl.readOnly = false;
      inputEl.classList.remove("is-locked");
      row.classList.remove("is-locked");
    } else {
      setLockState(inputEl, true);
    }
  });
  addLinkBtn.disabled = !enabled;
  if (field) field.classList.toggle("is-view", !enabled);
  if (addRow) addRow.style.display = enabled ? "" : "none";
  refreshUI();
  if (pageEditBtn) {
    pageEditBtn.innerHTML = enabled ? UPDATE_ICON_SVG : EDIT_ICON_SVG;
    pageEditBtn.setAttribute("aria-label", enabled ? "Update" : "Edit");
  }
};

const updatePageEditVisibility = () => {
  if (!pageEditBtn) return;
  const hasAnyValue = getLinkInputs().some((item) => item.value.trim().length > 0);
  const shouldShow = editMode || hasPrefilled || hasAnyValue;
  pageEditBtn.style.display = shouldShow ? "inline-flex" : "none";
};

const updateForwardVisibility = () => {
  if (!forwardShareBtn) return;
  const hasAnyValue = getLinkInputs().some((item) => item.value.trim().length > 0);
  forwardShareBtn.style.display = hasAnyValue ? "inline-flex" : "none";
};

const refreshUI = () => {
  updateRemoveButtons();
  updateLinkNumbers();
  updatePageEditVisibility();
  updateForwardVisibility();
  updateStatusInvalidSummary();
};

const getSystemTheme = () => (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");

const getPreferredTheme = () => {
  const saved = localStorage.getItem("theme");
  if (saved === "light" || saved === "dark" || saved === "auto") return saved;
  return "auto";
};

const applyTheme = (theme) => {
  const effective = theme === "auto" ? getSystemTheme() : theme;
  document.body.dataset.theme = effective;
  themeOptions.forEach((btn) => {
    const selected = btn.dataset.theme === theme;
    btn.setAttribute("aria-pressed", selected ? "true" : "false");
  });
};

const isValidUrl = (value) => {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

const isValidUriScheme = (value) => {
  const match = value.match(/^([a-z][a-z0-9+.-]*):/i);
  if (!match) return false;
  const scheme = match[1].toLowerCase();
  if (scheme === "http" || scheme === "https") return false;
  if (value.startsWith(`${scheme}://`)) return value.length >= scheme.length + 3;
  return false;
};

const validateLink = (value) => {
  if (isValidUrl(value)) return { ok: true, type: "URL" };
  if (isValidUriScheme(value)) return { ok: true, type: "URI scheme" };
  return { ok: false, type: "" };
};

const isDesktop = () => window.matchMedia(DESKTOP_QUERY).matches;

const addQrPadding = (pad = 16) => {
  const img = qrCanvas.querySelector("img");
  const canvas = qrCanvas.querySelector("canvas");
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

    qrCanvas.innerHTML = "";
    qrCanvas.appendChild(paddedImg);
  };

  if (img && !img.complete) {
    img.addEventListener("load", draw, { once: true });
    return;
  }

  requestAnimationFrame(draw);
};

const openQrModal = async (value, title, displayText) => {
  try {
    await window.QR_LIB.load();
    qrCanvas.innerHTML = "";
    window.QR_LIB.render(qrCanvas, value, { size: 220 });
    addQrPadding(16);
    if (qrTitle) qrTitle.textContent = title || "Scan to test";
    qrText.textContent = displayText || value;
    qrModal.classList.add("is-open");
    qrModal.setAttribute("aria-hidden", "false");
  } catch {
    setStatus("QR code library failed to load.", "Error", "error");
  }
};

const closeQrModal = () => {
  qrModal.classList.remove("is-open");
  qrModal.setAttribute("aria-hidden", "true");
};

const openLink = (inputEl = input) => {
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

  trackEvent("ga_click_link", { type: validation.type });
  const row = inputEl.closest(".link-row");
  const index = row ? Number(row.dataset.index || "0") : 0;
  const label = `Link ${index + 1}`;
  const displayText = `${label}: ${value}`;
  setStatus(`Attempting to open (${validation.type}): <span>${value}</span>`, "Working", "working");

  if (isDesktop()) {
    openQrModal(value, `Scan ${label}`, displayText);
    return;
  }

  try {
    window.location.href = value;
  } catch {
    setStatus("This link could not be opened by the browser.", "Error", "error");
  }
};

const handleThemeSelect = (theme) => {
  localStorage.setItem("theme", theme);
  applyTheme(theme);
};

const handleShare = async () => {
  const inputs = getLinkInputs();
  const values = inputs.map((item) => item.value.trim()).filter((item) => item.length > 0);
  if (values.length === 0) {
    setStatus("Enter at least one link, then generate a share URL.", "Error", "error");
    return;
  }

  for (let i = 0; i < values.length; i += 1) {
    const validation = validateLink(values[i]);
    if (!validation.ok) {
      setStatus(`Invalid format in link #${i + 1}.`, "Error", "error");
      return;
    }
  }

  const url = new URL(window.location.href);
  url.search = "";
  values.forEach((value, index) => {
    url.searchParams.set(`link${index + 1}`, value);
  });

  try {
    trackEvent("ga_share_link");
    await navigator.clipboard.writeText(url.toString());
    if (navigator.share && !isDesktop()) {
      try {
        await navigator.share({ url: url.toString() });
        setStatus("Share sheet opened.", "Ready", "ready");
        return;
      } catch (err) {
        if (err && err.name === "AbortError") return;
      }
    }
    setStatus("Share URL copied. Send it to a friend to test.", "Ready", "ready");
  } catch {
    setStatus("Clipboard access was blocked by the browser.", "Error", "error");
  }
};

const prefillFromUrl = () => {
  const url = new URL(window.location.href);
  const links = [];
  for (let i = 1; i <= MAX_LINKS; i += 1) {
    const value = url.searchParams.get(`link${i}`);
    if (value) links.push(value);
  }
  if (links.length === 0) return;
  if (links.length > 1) {
    enableMultiMode();
  } else {
    disableMultiMode();
  }
  input.value = links[0];
  updateValidationState(input);
  lockIfValid(input);
  for (let i = 1; i < links.length; i += 1) {
    addLinkRow(links[i]);
  }
  setStatus("Links prefilled from share URL. Click the blue button to test deeplink.", "Ready", "ready");
  hadInputValue = true;
  refreshUI();
};

applyTheme(getPreferredTheme());
prefillFromUrl();
refreshUI();

if (shareBtn) shareBtn.addEventListener("click", handleShare);
if (forwardShareBtn) forwardShareBtn.addEventListener("click", handleShare);
addLinkBtn.addEventListener("click", () => addLinkRow());

attachInputEvents(input);
attachRowControls(input.closest(".link-row"), input);

if (pageEditBtn) {
  updatePageEditVisibility();
  pageEditBtn.addEventListener("click", () => {
    if (editMode) {
      const emptyGaps = getSaveBlockedIndexes();
      if (emptyGaps.length > 0) {
        setStatus(`Empty links not allowed at rows: ${emptyGaps.join(", ")}`, "Error", "error");
        return;
      }
      const invalid = getInvalidIndexes();
      if (invalid.length > 0) {
        updateStatusInvalidSummary();
        return;
      }
      const values = getLinkInputs()
        .map((item) => item.value.trim())
        .filter((value) => value.length > 0);
      const url = new URL(window.location.href);
      url.search = "";
      values.forEach((value, index) => {
        url.searchParams.set(`link${index + 1}`, value);
      });
      window.history.replaceState({}, "", url.toString());
      if (values.length === 0) {
        setStatus("Input the deeplink to start testing.", "", "idle");
        setEditMode(true);
        return;
      }
      setStatus("Updated.", "Ready", "ready");
      setEditMode(false);
      return;
    }
    setEditMode(true);
  });
}

if (hasPrefilled) {
  setEditMode(false);
} else {
  setEditMode(true);
}

const startReorder = (row) => {
  draggingRow = row;
  dragPending = null;
  if (!draggingRow) return;
  draggingRow.classList.add("is-dragging");
  document.body.classList.add("is-reordering");
};

const updateReorderPosition = (y) => {
  if (!draggingRow) return;
  const after = getDragAfterElement(linksList, y);
  if (dropIndicator && dropIndicator !== after) {
    dropIndicator.classList.remove("drop-before");
    dropIndicator = null;
  }
  linksList.classList.remove("drop-end");
  if (after) {
    if (after !== dropIndicator) {
      after.classList.add("drop-before");
      dropIndicator = after;
    }
  } else {
    linksList.classList.add("drop-end");
  }
  if (after == null) {
    linksList.appendChild(draggingRow);
  } else {
    linksList.insertBefore(draggingRow, after);
  }
};

const endReorder = () => {
  if (!draggingRow && !dragPending) return;
  if (draggingRow) {
    draggingRow.classList.remove("is-dragging");
  }
  draggingRow = null;
  dragPending = null;
  if (dropIndicator) {
    dropIndicator.classList.remove("drop-before");
    dropIndicator = null;
  }
  linksList.classList.remove("drop-end");
  document.body.classList.remove("is-reordering");
  updateLinkNumbers();
  updateStatusInvalidSummary();
};

linksList.addEventListener("pointerdown", (event) => {
  if (!editMode || !linksList.classList.contains("is-reorder")) return;
  const row = event.target.closest(".link-row");
  if (!row) return;
  if (event.target.closest("button")) return;
  if (pointerActive) return;
  pointerActive = true;
  pointerId = event.pointerId;
  try {
    if (linksList.setPointerCapture) linksList.setPointerCapture(event.pointerId);
  } catch {
    // no-op
  }
  dragPending = { row };
  dragStartY = event.clientY;
});

linksList.addEventListener("pointermove", (event) => {
  if (!pointerActive) return;
  if (pointerId !== null && event.pointerId !== pointerId) return;
  if (!dragPending && !draggingRow) return;
  if (dragPending && !draggingRow) {
    const delta = Math.abs(event.clientY - dragStartY);
    if (delta < 6) return;
    startReorder(dragPending.row);
  }
  if (draggingRow) {
    if (event.cancelable) event.preventDefault();
    updateReorderPosition(event.clientY);
  }
});

linksList.addEventListener("pointerup", (event) => {
  if (!pointerActive) return;
  pointerActive = false;
  pointerId = null;
  try {
    if (linksList.releasePointerCapture && event.pointerId != null) {
      linksList.releasePointerCapture(event.pointerId);
    }
  } catch {
    // no-op
  }
  endReorder();
});
linksList.addEventListener("pointercancel", () => {
  if (!pointerActive) return;
  pointerActive = false;
  pointerId = null;
  endReorder();
});

themeOptions.forEach((btn) => {
  btn.addEventListener("click", () => handleThemeSelect(btn.dataset.theme));
});

const media = window.matchMedia("(prefers-color-scheme: dark)");
media.addEventListener("change", () => {
  if (getPreferredTheme() === "auto") {
    applyTheme("auto");
  }
});
qrClose.addEventListener("click", closeQrModal);
qrBackdrop.addEventListener("click", closeQrModal);

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && qrModal.classList.contains("is-open")) {
    closeQrModal();
  }
});
let pointerActive = false;
let pointerId = null;
