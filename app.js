const input = document.getElementById("deeplink");
const openBtn = document.getElementById("openBtn");
const shareBtn = document.getElementById("shareBtn");
const themeToggle = document.getElementById("themeToggle");
const status = document.getElementById("status");
const historyDropdown = document.getElementById("historyDropdown");
const historyList = document.getElementById("historyList");
const clearHistoryBtn = document.getElementById("clearHistoryBtn");
const historyToggle = document.getElementById("historyToggle");
const qrModal = document.getElementById("qrModal");
const qrClose = document.getElementById("qrClose");
const qrCanvas = document.getElementById("qrCanvas");
const qrText = document.getElementById("qrText");
const qrBackdrop = document.querySelector(".qr-backdrop");

const HISTORY_KEY = "deeplink_history";
const HISTORY_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const HISTORY_LIMIT = 10;
const DESKTOP_QUERY = "(min-width: 700px)";

let historyItems = [];
let activeHistoryIndex = -1;
let suppressFocusOpen = false;

const setStatus = (text, emphasis = "", state = "idle") => {
  status.classList.remove("status--ready", "status--error", "status--working");
  if (state) status.classList.add(`status--${state}`);
  status.innerHTML = emphasis ? `<strong>${emphasis}</strong> ${text}` : text;
};

const getPreferredTheme = () => {
  const saved = localStorage.getItem("theme");
  if (saved === "light" || saved === "dark") return saved;
  return "light";
};

const applyTheme = (theme) => {
  document.body.dataset.theme = theme;
  themeToggle.setAttribute("aria-label", theme === "dark" ? "Switch to light" : "Switch to dark");
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
  return value.length > scheme.length + 1;
};

const validateLink = (value) => {
  if (isValidUrl(value)) return { ok: true, type: "URL" };
  if (isValidUriScheme(value)) return { ok: true, type: "URI scheme" };
  return { ok: false, type: "" };
};

const loadHistory = () => {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const now = Date.now();
    const filtered = parsed.filter((item) => item && item.value && now - item.time < HISTORY_TTL_MS);
    if (filtered.length !== parsed.length) {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(filtered.slice(0, HISTORY_LIMIT)));
    }
    return filtered;
  } catch {
    return [];
  }
};

const saveHistory = (items) => {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, HISTORY_LIMIT)));
};

const updateHistoryState = () => {
  historyItems = loadHistory();
  historyToggle.disabled = false;
};

const renderHistoryList = (items) => {
  historyList.innerHTML = "";
  if (items.length === 0) {
    const empty = document.createElement("li");
    empty.className = "history-empty";
    empty.textContent = "No history";
    historyList.appendChild(empty);
    activeHistoryIndex = -1;
    return;
  }
  items.forEach((item) => {
    const row = document.createElement("li");
    row.className = "history-item";
    row.setAttribute("role", "option");
    row.setAttribute("tabindex", "-1");
    row.textContent = item.value;
    row.addEventListener("click", () => {
      input.value = item.value;
      setStatus("History inserted. Ready to test.", "Ready", "ready");
      setHistoryOpen(false);
      input.focus();
    });
    historyList.appendChild(row);
  });
  activeHistoryIndex = -1;
};

const setActiveHistoryItem = (index) => {
  const items = Array.from(historyList.querySelectorAll(".history-item"));
  if (items.length === 0) return;
  items.forEach((item) => {
    item.classList.remove("is-active");
    item.setAttribute("aria-selected", "false");
  });
  const bounded = Math.max(0, Math.min(index, items.length - 1));
  items[bounded].classList.add("is-active");
  items[bounded].setAttribute("aria-selected", "true");
  items[bounded].scrollIntoView({ block: "nearest" });
  activeHistoryIndex = bounded;
};

const isHistoryOpen = () => historyDropdown.classList.contains("is-open");

const setHistoryOpen = (open) => {
  historyDropdown.classList.toggle("is-open", open);
  historyDropdown.setAttribute("aria-hidden", open ? "false" : "true");
  historyToggle.setAttribute("aria-expanded", open ? "true" : "false");
};

const refreshHistoryDropdown = (forceOpen = false) => {
  const shouldOpen = forceOpen || input.value.trim().length > 0;
  if (!shouldOpen) {
    setHistoryOpen(false);
    return;
  }
  renderHistoryList(historyItems);
  setHistoryOpen(true);
};

const addToHistory = (value) => {
  const now = Date.now();
  const items = loadHistory().filter((item) => item.value !== value);
  items.unshift({ value, time: now });
  saveHistory(items);
  updateHistoryState();
  if (isHistoryOpen()) refreshHistoryDropdown(true);
};

const clearHistory = () => {
  localStorage.removeItem(HISTORY_KEY);
  updateHistoryState();
  setHistoryOpen(false);
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

const openQrModal = async (value) => {
  try {
    await window.QR_LIB.load();
    qrCanvas.innerHTML = "";
    window.QR_LIB.render(qrCanvas, value, { size: 220 });
    addQrPadding(16);
    qrText.textContent = value;
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

const openLink = () => {
  const value = input.value.trim();
  if (!value) {
    setStatus("Please enter a link or URI scheme.", "Error", "error");
    input.focus();
    return;
  }

  const validation = validateLink(value);
  if (!validation.ok) {
    setStatus("Format should be a URL (http/https) or a URI scheme like myapp://.", "Error", "error");
    input.focus();
    return;
  }

  addToHistory(value);
  setStatus(`Attempting to open (${validation.type}): <span>${value}</span>`, "Working", "working");

  if (isDesktop()) {
    openQrModal(value);
    return;
  }

  try {
    window.location.href = value;
  } catch {
    setStatus("This link could not be opened by the browser.", "Error", "error");
  }
};

const handleHistoryToggle = () => {
  if (!isHistoryOpen()) {
    refreshHistoryDropdown(true);
  } else {
    setHistoryOpen(false);
    suppressFocusOpen = true;
    setTimeout(() => {
      suppressFocusOpen = false;
    }, 150);
  }
  input.focus();
};

const handleInputFocus = () => {
  if (suppressFocusOpen) return;
  if (historyItems.length > 0) refreshHistoryDropdown(true);
};

const handleInputKeydown = (event) => {
  const isOpen = isHistoryOpen();
  const items = isOpen ? Array.from(historyList.querySelectorAll(".history-item")) : [];

  if (event.key === "Enter") {
    if (isOpen && activeHistoryIndex >= 0 && items[activeHistoryIndex]) {
      event.preventDefault();
      items[activeHistoryIndex].click();
      setHistoryOpen(false);
      return;
    }
    setHistoryOpen(false);
    openLink();
    return;
  }

  if (!isOpen || items.length === 0) return;

  if (event.key === "ArrowDown") {
    event.preventDefault();
    const nextIndex = activeHistoryIndex + 1;
    setActiveHistoryItem(nextIndex >= items.length ? 0 : nextIndex);
  } else if (event.key === "ArrowUp") {
    event.preventDefault();
    const prevIndex = activeHistoryIndex - 1;
    setActiveHistoryItem(prevIndex < 0 ? items.length - 1 : prevIndex);
  } else if (event.key === "Escape") {
    setHistoryOpen(false);
  }
};

const handleDocumentClick = (event) => {
  if (!isHistoryOpen()) return;
  if (!historyDropdown.contains(event.target) && !historyToggle.contains(event.target) && event.target !== input) {
    setHistoryOpen(false);
  }
};

const handleThemeToggle = () => {
  const next = document.body.dataset.theme === "dark" ? "light" : "dark";
  localStorage.setItem("theme", next);
  applyTheme(next);
};

const handleShare = async () => {
  const value = input.value.trim();
  if (!value) {
    setStatus("Enter a link first, then generate a share URL.", "Error", "error");
    return;
  }

  const validation = validateLink(value);
  if (!validation.ok) {
    setStatus("Invalid format. Please enter a URL or URI scheme first.", "Error", "error");
    return;
  }

  const url = new URL(window.location.href);
  url.searchParams.set("link", value);

  try {
    await navigator.clipboard.writeText(url.toString());
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Deeplink Testing Tool",
          text: "Test this deeplink:",
          url: url.toString()
        });
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
  const link = url.searchParams.get("link");
  if (!link) return;
  input.value = link;
  setStatus("Link prefilled from share URL.", "Ready", "ready");
};

applyTheme(getPreferredTheme());
updateHistoryState();
setHistoryOpen(false);
prefillFromUrl();

openBtn.addEventListener("click", openLink);
shareBtn.addEventListener("click", handleShare);
clearHistoryBtn.addEventListener("click", clearHistory);

historyToggle.addEventListener("click", handleHistoryToggle);
input.addEventListener("input", () => refreshHistoryDropdown(false));
input.addEventListener("focus", handleInputFocus);
input.addEventListener("keydown", handleInputKeydown);

historyDropdown.addEventListener("click", () => setHistoryOpen(false));
document.addEventListener("click", handleDocumentClick);

themeToggle.addEventListener("click", handleThemeToggle);
qrClose.addEventListener("click", closeQrModal);
qrBackdrop.addEventListener("click", closeQrModal);

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && qrModal.classList.contains("is-open")) {
    closeQrModal();
  }
});
