// =========================================================
// TOOLS WINDOW COMMUNICATION
// =========================================================

const toolsChannel =
    new BroadcastChannel(
        "tactical-tools-channel"
    );


window.toolsChannel =
    toolsChannel;


const isToolsWindow =
    window.location.pathname.endsWith(
        "tools.html"
    );


console.log(
    "BroadcastChannel initialized"
);


console.log(
    "PAGE:",
    isToolsWindow
        ? "TOOLS WINDOW"
        : "MAIN MAP"
);


// =========================================================
// DETACHED WINDOW
// =========================================================

let toolsWindow =
    null;


// =========================================================
// RECEIVE BROADCAST MESSAGES
// =========================================================

toolsChannel.onmessage =
    event => {

        console.log(
            "MESSAGE RECEIVED:",
            event.data
        );


        const data =
            event.data;


        if (
            !data ||
            !data.type
        ) {
            return;
        }


        // =====================================================
        // TOOLS WINDOW READY
        // =====================================================

        if (
            data.type ===
            "TOOLS_WINDOW_READY"
        ) {

            console.log(
                "TOOLS WINDOW READY"
            );


            /*
             * Main panel is hidden when opening.
             *
             * This is just a safety check.
             */

            if (!isToolsWindow) {

                const dock =
                    document.querySelector(
                        ".tactical-menu-dock"
                    );


                if (dock) {

                    dock.style.display =
                        "none";

                }

            }


            return;
        }


        // =====================================================
        // TOOL SELECTED
        // =====================================================

        if (
            data.type ===
            "TOOL_SELECTED"
        ) {

            /*
             * Only the MAIN page should
             * react to the detached tool.
             */

            if (
                isToolsWindow
            ) {
                return;
            }


            console.log(
                "MAP RECEIVED TOOL:",
                data
            );


            showNotification(
                data.name
            );


            setStatus(
                `${data.name} selected`
            );


            /*
             * Save latest state.
             */

            window.selectedToolState =
                data;


            /*
             * Symbol selection.
             */

            if (
                data.id ===
                "symbol"
            ) {

                window.selectedTacticalSymbol = {

                    name:
                        data.name,

                    sidc:
                        data.sidc

                };

            }


            /*
             * Mask state.
             */

            if (
                data.enabled !==
                undefined
            ) {

                window.maskSettings =
                    window.maskSettings ||
                    {};


                window.maskSettings[
                    data.id
                ] =
                    data.enabled;

            }


            return;
        }

    };


// =========================================================
// OPEN TOOLS WINDOW
// =========================================================

function openToolsWindow() {

    if (
        toolsWindow &&
        !toolsWindow.closed
    ) {

        toolsWindow.focus();

        return;

    }


    const dock =
        document.querySelector(
            ".tactical-menu-dock"
        );


    if (!dock) {

        console.error(
            "Main tools dock not found"
        );

        return;

    }


    toolsWindow =
        window.open(
            "tools.html",
            "TacticalToolsWindow",
            "width=420,height=700,resizable=yes"
        );


    if (!toolsWindow) {

        alert(
            "Please allow popups for this site."
        );

        return;

    }


    /*
     * Hide ONLY the main page panel.
     *
     * We are NOT moving it.
     */

    dock.style.display =
        "none";


    console.log(
        "Detached tools window opened"
    );


    /*
     * Monitor detached window.
     */

    const checkClosed =
        setInterval(
            () => {

                if (
                    !toolsWindow ||
                    toolsWindow.closed
                ) {

                    clearInterval(
                        checkClosed
                    );


                    toolsWindow =
                        null;


                    /*
                     * Bring the main panel back.
                     */

                    dock.style.display =
                        "";


                    dock.classList.add(
                        "panel-open"
                    );


                    console.log(
                        "Tools window closed"
                    );


                    setStatus(
                        "Terrain editor ready"
                    );

                }

            },
            500
        );

}


// =========================================================
// GLOBAL
// =========================================================

window.openToolsWindow =
    openToolsWindow;


// =========================================================
// OPEN BUTTON
// =========================================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const openButton =
            document.getElementById(
                "openToolsButton"
            );


        if (openButton) {

            openButton.addEventListener(
                "click",
                openToolsWindow
            );

        }


        /*
         * Detached page tells the main page
         * that it has finished rendering.
         */

        if (
            isToolsWindow
        ) {

            setTimeout(
                () => {

                    toolsChannel.postMessage({

                        type:
                            "TOOLS_WINDOW_READY"

                    });


                    console.log(
                        "TOOLS WINDOW READY SENT"
                    );

                },
                300
            );

        }

    }
);


// =========================================================
// SECTION SWITCHING
// =========================================================

function switchSection(
    sectionId,
    btn
) {

    const dock =
        document.querySelector(
            ".tactical-menu-dock"
        );


    const clickedButton =
        btn ||
        document.querySelector(
            `.rail-btn[data-id="${sectionId}"]`
        );


    const target =
        document.getElementById(
            `section-${sectionId}`
        );


    if (
        !dock ||
        !target
    ) {
        return;
    }


    const alreadyOpen =
        clickedButton &&
        clickedButton.classList.contains(
            "active"
        );


    if (alreadyOpen) {

        closeTacticalPanel();

        return;

    }


    document
        .querySelectorAll(
            ".rail-btn"
        )
        .forEach(
            button => {

                button.classList.remove(
                    "active"
                );

            }
        );


    document
        .querySelectorAll(
            ".drawer-section"
        )
        .forEach(
            section => {

                section.classList.remove(
                    "section-visible"
                );


                section.classList.remove(
                    "section-from-left",
                    "section-from-right"
                );


                section.style.display =
                    "none";

            }
        );


    if (clickedButton) {

        clickedButton.classList.add(
            "active"
        );

    }


    dock.classList.add(
        "panel-open"
    );


    target.style.display =
        "flex";


    target.classList.add(
        "section-from-right"
    );


    requestAnimationFrame(
        () => {

            target.classList.add(
                "section-visible"
            );

        }
    );


    setStatus(
        `Opened ${sectionId.toUpperCase()}`
    );

}


// =========================================================
// CLOSE PANEL
// =========================================================

function closeTacticalPanel() {

    const dock =
        document.querySelector(
            ".tactical-menu-dock"
        );


    if (!dock) return;


    document
        .querySelectorAll(
            ".rail-btn"
        )
        .forEach(
            button => {

                button.classList.remove(
                    "active"
                );

            }
        );


    document
        .querySelectorAll(
            ".drawer-section"
        )
        .forEach(
            section => {

                section.classList.remove(
                    "section-visible"
                );


                section.style.display =
                    "none";

            }
        );


    dock.classList.remove(
        "panel-open"
    );


    hideNotification();


    setStatus(
        "Terrain editor ready"
    );

}


// =========================================================
// ESCAPE
// =========================================================

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key ===
            "Escape"
        ) {

            closeTacticalPanel();

        }

    }
);


// =========================================================
// SYMBOL SEARCH
// =========================================================

function filterCards() {

    const input =
        document.getElementById(
            "symbolSearch"
        );


    if (!input) return;


    const query =
        input.value
            .toLowerCase()
            .trim();


    document
        .querySelectorAll(
            ".tactical-symbol-card"
        )
        .forEach(
            card => {

                const name =
                    (
                        card.dataset.name ||
                        ""
                    ).toLowerCase();


                const category =
                    (
                        card.dataset.category ||
                        ""
                    ).toLowerCase();


                card.style.display =
                    name.includes(query) ||
                    category.includes(query)
                        ? "flex"
                        : "none";

            }
        );

}


// =========================================================
// SYMBOL FILTER
// =========================================================

function filterCategory(
    catId,
    pill
) {

    document
        .querySelectorAll(
            ".filter-pill"
        )
        .forEach(
            button => {

                button.classList.remove(
                    "active"
                );

            }
        );


    if (pill) {

        pill.classList.add(
            "active"
        );

    }


    document
        .querySelectorAll(
            ".tactical-symbol-card"
        )
        .forEach(
            card => {

                const category =
                    card.dataset.category;


                card.style.display =
                    catId === "all" ||
                    category === catId
                        ? "flex"
                        : "none";

            }
        );

}


// =========================================================
// SYMBOL SELECTION
// =========================================================

function selectSymbolCard(
    card,
    name,
    sidc
) {

    const wasActive =
        card.classList.contains(
            "selected"
        );


    document
        .querySelectorAll(
            ".tactical-symbol-card"
        )
        .forEach(
            symbolCard => {

                symbolCard.classList.remove(
                    "selected"
                );

            }
        );


    if (wasActive) {

        hideNotification();


        setStatus(
            `${name} deselected`
        );


        toolsChannel.postMessage({

            type:
                "TOOL_SELECTED",

            id:
                "symbol",

            name:
                `${name} deselected`,

            sidc:
                sidc,

            selected:
                false

        });


        return;

    }


    card.classList.add(
        "selected"
    );


    window.selectedTacticalSymbol = {

        name:
            name,

        sidc:
            sidc

    };


    /*
     * Send to MAIN MAP.
     */

    toolsChannel.postMessage({

        type:
            "TOOL_SELECTED",

        id:
            "symbol",

        name:
            name,

        sidc:
            sidc,

        selected:
            true

    });


    showNotification(
        name
    );


    setStatus(
        `Armed: ${name}`
    );

}


// =========================================================
// SLIDER
// =========================================================

function sliderChange(
    id,
    value,
    unit
) {

    const numEl =
        document.getElementById(
            `${id}Value`
        );


    if (numEl) {

        numEl.textContent =
            `${value} ${unit}`;

    }


    toolsChannel.postMessage({

        type:
            "TOOL_SELECTED",

        id:
            id,

        name:
            `${id}: ${value} ${unit}`,

        value:
            Number(value)

    });


    setStatus(
        `${id}: ${value} ${unit}`
    );

}


// =========================================================
// STEPPER
// =========================================================

function stepValue(
    id,
    delta,
    unit
) {

    const slider =
        document.getElementById(
            `${id}Slider`
        );


    if (!slider) return;


    let newVal =
        Number(slider.value) +
        delta;


    newVal =
        Math.max(
            Number(slider.min),
            Math.min(
                Number(slider.max),
                newVal
            )
        );


    slider.value =
        newVal;


    sliderChange(
        id,
        newVal,
        unit
    );

}


// =========================================================
// MASK / TOGGLE
// =========================================================

function toggleMaskSetting(
    button,
    id,
    onText,
    offText
) {

    const isEnabled =
        button.dataset.enabled ===
        "true";


    const nextState =
        !isEnabled;


    button.dataset.enabled =
        String(
            nextState
        );


    button.classList.toggle(
        "active",
        nextState
    );


    const label =
        button.querySelector(
            ".toggle-text"
        );


    if (label) {

        label.textContent =
            nextState
                ? onText
                : offText;

    }


    const message =
        nextState
            ? onText
            : offText;


    toolsChannel.postMessage({

        type:
            "TOOL_SELECTED",

        id:
            id,

        name:
            message,

        enabled:
            nextState

    });


    showNotification(
        message
    );


    setStatus(
        `${id}: ${
            nextState
                ? "ENABLED"
                : "DISABLED"
        }`
    );

}


// =========================================================
// BUTTON SELECTION
// =========================================================

function selectOption(
    button,
    id,
    name
) {

    const wasSelected =
        button.classList.contains(
            "selected"
        );


    const parent =
        button.closest(
            ".drawer-section"
        );


    if (parent) {

        parent
            .querySelectorAll(
                ".tool-button.selected"
            )
            .forEach(
                btn => {

                    btn.classList.remove(
                        "selected"
                    );

                }
            );

    }


    if (wasSelected) {

        hideNotification();


        setStatus(
            `${name} deselected`
        );


        toolsChannel.postMessage({

            type:
                "TOOL_SELECTED",

            id:
                id,

            name:
                `${name} deselected`,

            selected:
                false

        });


        return;

    }


    button.classList.add(
        "selected"
    );


    toolsChannel.postMessage({

        type:
            "TOOL_SELECTED",

        id:
            id,

        name:
            name,

        selected:
            true

    });


    showNotification(
        name
    );


    setStatus(
        `${name} selected`
    );

}


// =========================================================
// ACTIONS: UNDO / REDO / RESET
// =========================================================

function performAction(
    id,
    name
) {

    document
        .querySelectorAll(
            ".tool-button.selected"
        )
        .forEach(
            button => {

                button.classList.remove(
                    "selected"
                );

            }
        );


    /*
     * Send action to MAIN MAP.
     */

    toolsChannel.postMessage({

        type:
            "TOOL_SELECTED",

        id:
            id,

        name:
            name,

        action:
            true

    });


    showNotification(
        name
    );


    setStatus(
        `Action: ${name}`
    );

}


// =========================================================
// NOTIFICATION
// =========================================================

let statusTimer =
    null;


let notifTimer =
    null;


function showNotification(
    name
) {

    const notif =
        document.getElementById(
            "toolNotification"
        );


    const text =
        document.getElementById(
            "notificationText"
        );


    if (
        !notif ||
        !text
    ) {
        return;
    }


    text.textContent =
        name;


    notif.classList.add(
        "show"
    );


    clearTimeout(
        notifTimer
    );


    notifTimer =
        setTimeout(
            () => {

                notif.classList.remove(
                    "show"
                );

            },
            1500
        );

}


// =========================================================
// HIDE NOTIFICATION
// =========================================================

function hideNotification() {

    const notif =
        document.getElementById(
            "toolNotification"
        );


    if (notif) {

        notif.classList.remove(
            "show"
        );

    }

}


// =========================================================
// STATUS
// =========================================================

function setStatus(
    message
) {

    const status =
        document.getElementById(
            "statusText"
        );


    if (!status) return;


    status.textContent =
        message;


    clearTimeout(
        statusTimer
    );


    statusTimer =
        setTimeout(
            () => {

                status.textContent =
                    "Terrain editor ready";

            },
            2500
        );

}


// =========================================================
// RESIZER
// =========================================================

function initDockResizer() {

    const dock =
        document.querySelector(
            ".tactical-menu-dock"
        );


    if (!dock) return;


    let isResizing =
        false;


    let startX =
        0;


    let startY =
        0;


    let startWidth =
        0;


    let startHeight =
        0;


    const MIN_WIDTH =
        320;


    const MAX_WIDTH =
        420;


    const MIN_HEIGHT =
        280;


    dock.addEventListener(
        "pointerdown",
        event => {

            const rect =
                dock.getBoundingClientRect();


            const isGrip =
                event.target.id ===
                    "dockResizeHandle" ||

                (
                    event.clientX >=
                        rect.right - 24 &&

                    event.clientY >=
                        rect.bottom - 24
                );


            if (!isGrip) {
                return;
            }


            isResizing =
                true;


            startX =
                event.clientX;


            startY =
                event.clientY;


            startWidth =
                dock.offsetWidth;


            startHeight =
                dock.offsetHeight;


            dock.classList.add(
                "resizing"
            );


            dock.setPointerCapture(
                event.pointerId
            );


            event.preventDefault();

        }
    );


    dock.addEventListener(
        "pointermove",
        event => {

            if (!isResizing) return;


            const maxHeight =
                window.innerHeight *
                0.92;


            const newWidth =
                Math.min(
                    MAX_WIDTH,
                    Math.max(
                        MIN_WIDTH,
                        startWidth +
                        event.clientX -
                        startX
                    )
                );


            const newHeight =
                Math.min(
                    maxHeight,
                    Math.max(
                        MIN_HEIGHT,
                        startHeight +
                        event.clientY -
                        startY
                    )
                );


            dock.style.width =
                `${newWidth}px`;


            dock.style.height =
                `${newHeight}px`;

        }
    );


    const stopResize =
        event => {

            if (!isResizing) return;


            isResizing =
                false;


            dock.classList.remove(
                "resizing"
            );


            try {

                dock.releasePointerCapture(
                    event.pointerId
                );

            }

            catch (_) {}


            setStatus(
                `Panel resized: ${
                    dock.offsetWidth
                }×${
                    dock.offsetHeight
                }px`
            );

        };


    dock.addEventListener(
        "pointerup",
        stopResize
    );


    dock.addEventListener(
        "pointercancel",
        stopResize
    );

}


// =========================================================
// INITIALIZE RESIZER
// =========================================================

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initDockResizer
    );

}

else {

    initDockResizer();

}


// =========================================================
// GLOBAL FUNCTIONS
// =========================================================

window.switchSection =
    switchSection;


window.closeTacticalPanel =
    closeTacticalPanel;


window.filterCards =
    filterCards;


window.filterCategory =
    filterCategory;


window.selectSymbolCard =
    selectSymbolCard;


window.selectOption =
    selectOption;


window.performAction =
    performAction;


window.sliderChange =
    sliderChange;


window.stepValue =
    stepValue;


window.toggleMaskSetting =
    toggleMaskSetting;


window.openToolsWindow =
    openToolsWindow;