export const state = {
    hadInputValue: false,
    lastNonErrorStatus: { text: "Please input testing link", emphasis: "", state: "idle" },
    editMode: true,
    draggingRow: null,
    dropIndicator: null,
    dragPending: null,
    dragStartY: 0,
    pointerActive: false,
    pointerId: null,
    undoStack: [],
};

export const updateState = (key, value) => {
    state[key] = value;
};
