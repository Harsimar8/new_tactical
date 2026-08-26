// =============================================================
// TOOLS WINDOW COMMUNICATION
// =============================================================

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


// =============================================================
// DETACHED WINDOW
// =============================================================

let toolsWindow =
    null;


// =============================================================
// STATE
// =============================================================

window.selectedToolState =
    null;


window.selectedTacticalSymbol =
    null;


window.maskSettings =
    window.maskSettings ||
    {};


// =============================================================
// RECEIVE BROADCAST MESSAGES
// =============================================================

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
             * Detached page sends tool
             * state to main map.
             *
             * Main map is the receiver.
             */

            if (isToolsWindow) {

                return;

            }


            console.log(
                "MAP RECEIVED TOOL:",
                data
            );


            window.selectedToolState =
                data;


            // =================================================
            // SYMBOL
            // =================================================

            if (
                data.toolType ===
                    "symbol" ||
                data.id ===
                    "symbol"
            ) {

                if (
                    data.selected !== false
                ) {

                    window.selectedTacticalSymbol = {

                        name:
                            data.name,

                        sidc:
                            data.sidc

                    };

                }

                else {

                    window.selectedTacticalSymbol =
                        null;

                }

            }


            // =================================================
            // TOGGLE
            // =================================================

            if (
                data.enabled !==
                undefined
            ) {

                window.maskSettings[
                    data.id
                ] =
                    data.enabled;

            }


            // =================================================
            // NOTIFICATION
            // =================================================

            if (
                data.selected === false
            ) {

                showNotification(
                    `${data.name} deselected`
                );

            }

            else {

                showNotification(
                    data.name
                );

            }


            // =================================================
            // STATUS
            // =================================================

            if (
                data.action
            ) {

                setStatus(
                    `Action: ${data.name}`
                );

            }

            else if (
                data.value !==
                undefined
            ) {

                setStatus(
                    `${data.name}`
                );

            }

            else if (
                data.enabled !==
                undefined
            ) {

                setStatus(
                    `${data.name}: ${
                        data.enabled
                            ? "ENABLED"
                            : "DISABLED"
                    }`
                );

            }

            else {

                setStatus(
                    data.selected === false
                        ? `${data.name} deselected`
                        : `${data.name} selected`
                );

            }


            return;

        }

    };


// =============================================================
// SEND TOOL MESSAGE
// =============================================================

function broadcastTool(
    payload
) {

    const message = {

        type:
            "TOOL_SELECTED",

        timestamp:
            Date.now(),

        ...payload

    };


    console.log(
        "BROADCAST TOOL:",
        message
    );


    toolsChannel.postMessage(
        message
    );


    /*
     * On the detached page, the message
     * is also immediately reflected locally.
     */

    if (isToolsWindow) {

        applyLocalToolState(
            message
        );

    }

}


// =============================================================
// LOCAL STATE
// =============================================================

function applyLocalToolState(
    data
) {

    window.selectedToolState =
        data;


    if (
        data.toolType ===
            "symbol" ||
        data.id ===
            "symbol"
    ) {

        if (
            data.selected !== false
        ) {

            window.selectedTacticalSymbol = {

                name:
                    data.name,

                sidc:
                    data.sidc

            };

        }

        else {

            window.selectedTacticalSymbol =
                null;

        }

    }


    if (
        data.enabled !==
        undefined
    ) {

        window.maskSettings[
            data.id
        ] =
            data.enabled;

    }

}


// =============================================================
// OPEN TOOLS WINDOW
// =============================================================

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
     * Hide main dock.
     *
     * Notification is intentionally
     * independent from the dock.
     */

    dock.style.display =
        "none";


    console.log(
        "Detached tools window opened"
    );


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


// =============================================================
// GLOBAL
// =============================================================

window.openToolsWindow =
    openToolsWindow;


// =============================================================
// DOM READY
// =============================================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        initToolEventDelegation();

        initSymbolSearch();

        initSymbolFilters();


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


        if (isToolsWindow) {

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


// =============================================================
// GENERIC TOOL EVENT DELEGATION
// =============================================================

function initToolEventDelegation() {

    document.addEventListener(
        "click",
        event => {

            // =================================================
            // SYMBOL
            // =================================================

            const symbolCard =
                event.target.closest(
                    ".tactical-symbol-card"
                );


            if (symbolCard) {

                selectSymbolElement(
                    symbolCard
                );

                return;

            }


            // =================================================
            // FILTER
            // =================================================

            const filterButton =
                event.target.closest(
                    "[data-filter-category]"
                );


            if (filterButton) {

                filterCategory(
                    filterButton.dataset.filterCategory,
                    filterButton
                );

                return;

            }


            // =================================================
            // STEPPER
            // =================================================

            const stepper =
                event.target.closest(
                    "[data-stepper]"
                );


            if (stepper) {

                handleStepper(
                    stepper
                );

                return;

            }


            // =================================================
            // TOGGLE
            // =================================================

            const toggle =
                event.target.closest(
                    "[data-tool-type='toggle']"
                );


            if (toggle) {

                handleGenericToggle(
                    toggle
                );

                return;

            }


            // =================================================
            // BUTTON / MODE
            // =================================================

            const toolButton =
                event.target.closest(
                    ".tool-button[data-tool-id]"
                );


            if (toolButton) {

                handleGenericButton(
                    toolButton
                );

                return;

            }

        }
    );


    // =========================================================
    // RANGE INPUT
    // =========================================================

    document.addEventListener(
        "input",
        event => {

            const slider =
                event.target.closest(
                    "input[data-tool-type='number']"
                );


            if (!slider) {
                return;
            }


            handleGenericSlider(
                slider
            );

        }
    );

}


// =============================================================
// GENERIC BUTTON
// =============================================================

function handleGenericButton(
    button
) {

    const id =
        button.dataset.toolId;


    const name =
        button.dataset.toolName ||
        id ||
        "Tool";


    const wasSelected =
        button.classList.contains(
            "selected"
        );


    const action =
        button.dataset.toolAction ===
        "true";


    // =========================================================
    // ACTION
    // =========================================================

    if (action) {

        clearSelectedButtons(
            button
        );


        broadcastTool({

            id:
                id,

            name:
                name,

            selected:
                true,

            action:
                true,

            toolType:
                button.dataset.toolType

        });


        showNotification(
            name
        );


        setStatus(
            `Action: ${name}`
        );


        return;

    }


    // =========================================================
    // NORMAL SELECT
    // =========================================================

    clearSelectedButtons(
        button
    );


    if (wasSelected) {

        broadcastTool({

            id:
                id,

            name:
                name,

            selected:
                false,

            toolType:
                button.dataset.toolType

        });


        hideNotification();


        setStatus(
            `${name} deselected`
        );


        return;

    }


    button.classList.add(
        "selected"
    );


    broadcastTool({

        id:
            id,

        name:
            name,

        selected:
            true,

        toolType:
            button.dataset.toolType

    });


    showNotification(
        name
    );


    setStatus(
        `${name} selected`
    );

}


// =============================================================
// CLEAR BUTTON SELECTION
// =============================================================

function clearSelectedButtons(
    currentButton
) {

    const section =
        currentButton.closest(
            ".drawer-section"
        );


    if (!section) return;


    section
        .querySelectorAll(
            ".tool-button.selected"
        )
        .forEach(
            button => {

                if (
                    button !==
                    currentButton
                ) {

                    button.classList.remove(
                        "selected"
                    );

                }

            }
        );

}


// =============================================================
// SYMBOL
// =============================================================

function selectSymbolElement(
    card
) {

    const name =
        card.dataset.toolName ||
        card.dataset.name ||
        "Symbol";


    const sidc =
        card.dataset.toolSidc ||
        "";


    const wasSelected =
        card.classList.contains(
            "selected"
        );


    document
        .querySelectorAll(
            ".tactical-symbol-card.selected"
        )
        .forEach(
            other => {

                other.classList.remove(
                    "selected"
                );

            }
        );


    if (wasSelected) {

        window.selectedTacticalSymbol =
            null;


        broadcastTool({

            id:
                "symbol",

            name:
                name,

            sidc:
                sidc,

            selected:
                false,

            toolType:
                "symbol"

        });


        hideNotification();


        setStatus(
            `${name} deselected`
        );


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


    broadcastTool({

        id:
            "symbol",

        name:
            name,

        sidc:
            sidc,

        selected:
            true,

        toolType:
            "symbol"

    });


    showNotification(
        name
    );


    setStatus(
        `Armed: ${name}`
    );

}


// =============================================================
// GENERIC TOGGLE
// =============================================================

function handleGenericToggle(
    button
) {

    const current =
        button.dataset.enabled ===
        "true";


    const next =
        !current;


    button.dataset.enabled =
        String(
            next
        );


    button.classList.toggle(
        "active",
        next
    );


    const label =
        button.querySelector(
            ".toggle-text"
        );


    const onText =
        button.dataset.onLabel ||
        `${button.dataset.toolName}: ON`;


    const offText =
        button.dataset.offLabel ||
        `${button.dataset.toolName}: OFF`;


    const message =
        next
            ? onText
            : offText;


    if (label) {

        label.textContent =
            message;

    }


    broadcastTool({

        id:
            button.dataset.toolId,

        name:
            message,

        selected:
            true,

        enabled:
            next,

        toolType:
            "toggle"

    });


    showNotification(
        message
    );


    setStatus(
        `${button.dataset.toolName}: ${
            next
                ? "ENABLED"
                : "DISABLED"
        }`
    );

}


// =============================================================
// GENERIC SLIDER
// =============================================================

function handleGenericSlider(
    slider
) {

    const id =
        slider.dataset.toolId;


    const value =
        Number(
            slider.value
        );


    const unit =
        slider.dataset.toolUnit ||
        "";


    const name =
        slider.dataset.toolName ||
        id ||
        "Value";


    const valueElement =
        document.getElementById(
            `${id}Value`
        );


    if (valueElement) {

        valueElement.textContent =
            `${value} ${unit}`;

    }


    broadcastTool({

        id:
            id,

        name:
            `${name}: ${value} ${unit}`,

        value:
            value,

        unit:
            unit,

        toolType:
            "number"

    });


    setStatus(
        `${name}: ${value} ${unit}`
    );

}


// =============================================================
// STEPPER
// =============================================================

function handleStepper(
    button
) {

    const id =
        button.dataset.toolId;


    const slider =
        document.querySelector(
            `input[data-tool-id="${CSS.escape(id)}"]`
        );


    if (!slider) return;


    const step =
        Number(
            button.dataset.step ||
            slider.step ||
            1
        );


    const direction =
        button.dataset.stepper ===
        "up"
            ? 1
            : -1;


    let value =
        Number(slider.value) +
        step *
        direction;


    value =
        Math.max(
            Number(slider.min),
            Math.min(
                Number(slider.max),
                value
            )
        );


    slider.value =
        value;


    slider.dispatchEvent(
        new Event(
            "input",
            {
                bubbles: true
            }
        )
    );

}


// =============================================================
// SEARCH
// =============================================================

function initSymbolSearch() {

    const input =
        document.getElementById(
            "symbolSearch"
        );


    if (!input) return;


    input.addEventListener(
        "input",
        filterCards
    );

}


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


// =============================================================
// SYMBOL FILTER
// =============================================================

function initSymbolFilters() {

    /*
     * Event delegation handles these.
     * Nothing else is required here.
     */

}


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


// =============================================================
// SECTION SWITCHING
// =============================================================

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
            `.rail-btn[data-id="${CSS.escape(sectionId)}"]`
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


// =============================================================
// CLOSE PANEL
// =============================================================

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


// =============================================================
// ESCAPE
// =============================================================

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


// =============================================================
// NOTIFICATION
// =============================================================

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

        console.warn(
            "Tool notification elements not found"
        );

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


// =============================================================
// HIDE NOTIFICATION
// =============================================================

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


// =============================================================
// STATUS
// =============================================================

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


// =============================================================
// RESIZER
// =============================================================

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


// =============================================================
// INITIALIZE RESIZER
// =============================================================

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


// =============================================================
// GLOBAL FUNCTIONS
// =============================================================

window.switchSection =
    switchSection;


window.closeTacticalPanel =
    closeTacticalPanel;


window.filterCards =
    filterCards;


window.filterCategory =
    filterCategory;


window.showNotification =
    showNotification;


window.hideNotification =
    hideNotification;


window.setStatus =
    setStatus;


window.handleGenericButton =
    handleGenericButton;


window.handleGenericToggle =
    handleGenericToggle;


window.handleGenericSlider =
    handleGenericSlider;


window.openToolsWindow =
    openToolsWindow;