// Used global window.GLOBAL_SVGS

export const MAX_LINKS = 10;
export const DESKTOP_QUERY = "(min-width: 700px)";

export const SVGS = {
    EDIT: GLOBAL_SVGS.EDIT,
    UPDATE: GLOBAL_SVGS.UPDATE,
    REMOVE: GLOBAL_SVGS.REMOVE,
    DRAG: GLOBAL_SVGS.DRAG,
    ADD: GLOBAL_SVGS.ADD,
    FORWARD: GLOBAL_SVGS.FORWARD,
    DOWNLOAD: GLOBAL_SVGS.DOWNLOAD,
    LINK: GLOBAL_SVGS.LINK,
    THEME_LIGHT: GLOBAL_SVGS.THEME_LIGHT,
    THEME_DARK: GLOBAL_SVGS.THEME_DARK
};

export const DOM = {
    input: () => document.getElementById("deeplink-0"),
    shareBtn: () => document.getElementById("shareBtn"),
    addLinkBtn: () => document.getElementById("addLinkBtn"),
    linksList: () => document.getElementById("linksList"),
    addRow: () => document.querySelector(".add-row"),
    saveBtn: () => document.getElementById("saveBtn"),
    field: () => document.querySelector(".field"),
    themeOptions: () => Array.from(document.querySelectorAll(".theme-option")),
    forwardShareBtn: () => document.getElementById("forwardShareBtn"),
    pageEditBtn: () => document.getElementById("pageEditBtn"),
    status: () => document.getElementById("status"),
    qrModal: () => document.getElementById("qrModal"),
    qrClose: () => document.getElementById("qrClose"),
    qrCanvas: () => document.getElementById("qrCanvas"),
    qrText: () => document.getElementById("qrText"),
    qrDownload: () => document.getElementById("qrDownload"),
    qrBackdrop: () => document.querySelector(".qr-backdrop"),
    qrTitle: () => document.getElementById("qrTitle"),
};
