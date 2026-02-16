// Used global window.GLOBAL_SVGS

export const MAX_LINKS = 10;
export const DESKTOP_QUERY = "(min-width: 700px)";

export const SVGS = {
    EDIT: `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor"><path d="M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z"/></svg>`,
    UPDATE: `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor"><path d="M840-680v480q0 33-23.5 56.5T760-120H200q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h480l160 160Zm-80 34L646-760H200v560h560v-446ZM565-275q35-35 35-85t-35-85q-35-35-85-35t-85 35q-35 35-35 85t35 85q35 35 85 35t85-35ZM240-560h360v-160H240v160Zm-40-86v446-560 114Z"/></svg>`,
    REMOVE: `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor"><path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z"/></svg>`,
    DRAG: `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor"><path d="M480-80 310-250l57-57 73 73v-206H235l73 72-58 58L80-480l169-169 57 57-72 72h206v-206l-73 73-57-57 170-170 170 170-57 57-73-73v206h205l-73-72 58-58 170 170-170 170-57-57 73-73H520v205l72-73 58 58L480-80Z"/></svg>`,
    ADD: `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor"><path d="M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z"/></svg>`,
    FORWARD: `<svg xmlns="http://www.w3.org/2000/svg" height="22px" viewBox="0 -960 960 960" width="22px" fill="currentColor"><path d="m640-280-57-56 184-184-184-184 57-56 240 240-240 240ZM80-200v-160q0-83 58.5-141.5T280-560h247L383-704l57-56 240 240-240 240-57-56 144-144H280q-50 0-85 35t-35 85v160H80Z"/></svg>`,
    DOWNLOAD: `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor"><path d="M480-320 280-520l56-58 104 104v-326h80v326l104-104 56 58-200 200ZM240-160q-33 0-56.5-23.5T160-240v-120h80v120h480v-120h80v120q0 33-23.5 56.5T720-160H240Z"/></svg>`,
    THEME_LIGHT: GLOBAL_SVGS.THEME_LIGHT,
    THEME_DARK: GLOBAL_SVGS.THEME_DARK
};

export const DOM = {
    input: () => document.getElementById("deeplink-0"),
    shareBtn: () => document.getElementById("shareBtn"),
    addLinkBtn: () => document.getElementById("addLinkBtn"),
    linksList: () => document.getElementById("linksList"),
    addRow: () => document.querySelector(".add-row"),
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
