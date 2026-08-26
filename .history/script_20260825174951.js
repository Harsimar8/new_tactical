/* =====================================================
   SECTION SWITCHING
===================================================== */

function switchSection(sectionId, btn) {

    const dock = document.querySelector(".tactical-menu-dock");

    const clickedButton = btn ||
        document.querySelector(`.rail-btn[data-id="${sectionId}"]`);

    const target = document.getElementById(`section-${sectionId}`);

    if (!dock || !target) return;


    const alreadyOpen =
        clickedButton &&
        clickedButton.classList.contains("active");


    /* =================================================
       CLICK SAME CATEGORY
       → CLOSE PANEL
    ================================================= */

    if (alreadyOpen) {

        closeTacticalPanel();

        return;
    }


    /* =================================================
       REMOVE ACTIVE FROM ALL CATEGORY BUTTONS
    ================================================= */

    document
        .querySelectorAll(".rail-btn")
        .forEach(button => {
            button.classList.remove("active");
        });


    /* =================================================
       HIDE ALL SECTIONS
    ================================================= */

    const previousSection =
        dock.querySelector(".drawer-section.section-visible");

    const direction = previousSection &&
        previousSection.compareDocumentPosition(target) & Node.DOCUMENT_POSITION_FOLLOWING
        ? "section-from-left"
        : "section-from-right";

    document
        .querySelectorAll(".drawer-section")
        .forEach(section => {

            section.classList.remove("section-visible");
            section.classList.remove("section-from-left", "section-from-right");

            section.style.display = "none";

        });


    /* =================================================
       ACTIVATE CLICKED CATEGORY
    ================================================= */

    if (clickedButton) {
        clickedButton.classList.add("active");
    }


    /* =================================================
       OPEN PANEL
    ================================================= */

    dock.classList.add("panel-open");


    /* =================================================
       SHOW TARGET SECTION
    ================================================= */

    target.style.display = "flex";
    target.classList.add(direction);
    target.classList.remove("section-visible");


    /*
     * Force browser to register the hidden state
     * before starting the animation.
     */

    requestAnimationFrame(() => {

        target.classList.add("section-visible");

    });


    setStatus(`Opened ${sectionId.toUpperCase()}`);
}


/* =====================================================
   CLOSE TACTICAL PANEL
===================================================== */

function closeTacticalPanel() {

    const dock =
        document.querySelector(".tactical-menu-dock");


    if (!dock) return;


    /* Remove active category */

    document
        .querySelectorAll(".rail-btn")
        .forEach(button => {

            button.classList.remove("active");

        });


    /* Close all sections */

    document
        .querySelectorAll(".drawer-section")
        .forEach(section => {

            section.classList.remove("section-visible");

            section.style.display = "none";

        });


    /* Close dock */

    dock.classList.remove("panel-open");
    dock.style.width = "";
    dock.style.height = "";


    hideNotification();

    setStatus("Terrain editor ready");
}


/* =====================================================
   ESCAPE KEY
===================================================== */

document.addEventListener("keydown", event => {

    if (event.key === "Escape") {

        closeTacticalPanel();

    }

});


/* =====================================================
   SYMBOL SEARCH
===================================================== */

function filterCards() {

    const input =
        document.getElementById("symbolSearch");

    if (!input) return;


    const query =
        input.value
            .toLowerCase()
            .trim();


    const cards =
        document.querySelectorAll(
            ".tactical-symbol-card"
        );


    cards.forEach(card => {

        const name =
            (
                card.getAttribute("data-name") || ""
            ).toLowerCase();


        const category =
            (
                card.getAttribute("data-category") || ""
            ).toLowerCase();


        if (
            name.includes(query) ||
            category.includes(query)
        ) {

            card.style.display = "flex";

        } else {

            card.style.display = "none";

        }

    });

}


/* =====================================================
   SYMBOL CATEGORY FILTER
===================================================== */

function filterCategory(catId, pill) {

    document
        .querySelectorAll(".filter-pill")
        .forEach(button => {

            button.classList.remove("active");

        });


    if (pill) {
        pill.classList.add("active");
    }


    const cards =
        document.querySelectorAll(
            ".tactical-symbol-card"
        );


    cards.forEach(card => {

        const category =
            card.getAttribute("data-category");


        if (
            catId === "all" ||
            category === catId
        ) {

            card.style.display = "flex";

        } else {

            card.style.display = "none";

        }

    });

}


/* =====================================================
   SYMBOL SELECTION
===================================================== */

function selectSymbolCard(card, name, sidc) {

    const wasActive =
        card.classList.contains("selected");


    /* Remove selection from all symbols */

    document
        .querySelectorAll(".tactical-symbol-card")
        .forEach(symbolCard => {

            symbolCard.classList.remove("selected");

        });


    /* ================================================
       DESELECT
    ================================================= */

    if (wasActive) {

        hideNotification();

        setStatus(`${name} deselected`);

        return;

    }


    /* ================================================
       SELECT
    ================================================= */

    card.classList.add("selected");

    showNotification(name);

    setStatus(`Armed: ${name}`);


    /*
     * Save selected symbol globally.
     * Useful later when placing it on the map.
     */

    window.selectedTacticalSymbol = {
        name: name,
        sidc: sidc
    };

}


/* =====================================================
   SLIDER CHANGE
===================================================== */

function sliderChange(id, value, unit) {

    const numEl =
        document.getElementById(`${id}Value`);


    if (numEl) {

        numEl.textContent =
            `${value} ${unit}`;

    }


    setStatus(
        `${id}: ${value} ${unit}`
    );

}


/* =====================================================
   SLIDER + / -
===================================================== */

function stepValue(id, delta, unit) {

    const slider =
        document.getElementById(`${id}Slider`);


    if (!slider) return;


    let newVal =
        Number(slider.value) + delta;


    newVal =
        Math.max(
            Number(slider.min),
            Math.min(
                Number(slider.max),
                newVal
            )
        );


    newVal =
        Math.round(newVal * 10) / 10;


    slider.value = newVal;


    sliderChange(
        id,
        newVal,
        unit
    );

}


/* =====================================================
   TOGGLE
===================================================== */

function toggleMaskSetting(
    button,
    id,
    onText,
    offText
) {

    const isEnabled =
        button.dataset.enabled === "true";


    const nextState =
        !isEnabled;


    button.dataset.enabled =
        String(nextState);


    button.classList.toggle(
        "active",
        nextState
    );


    const labelSpan =
        button.querySelector(".toggle-text");


    if (labelSpan) {

        labelSpan.textContent =
            nextState
                ? onText
                : offText;

    }


    showNotification(
        nextState
            ? onText
            : offText
    );


    setStatus(
        `${id}: ${
            nextState
                ? "ENABLED"
                : "DISABLED"
        }`
    );

}


/* =====================================================
   DRAG TO RESIZE
===================================================== */

function initDockResizer() {

    const dock =
        document.querySelector(
            ".tactical-menu-dock"
        );


    if (!dock) return;


    let isResizing = false;

    let startX = 0;
    let startY = 0;

    let startWidth = 0;
    let startHeight = 0;


    const MIN_WIDTH = 320;
    const MAX_WIDTH = 420;

    const MIN_HEIGHT = 280;


    function isResizeGrip(event) {

        const rect =
            dock.getBoundingClientRect();


        return (
            event.target.id === "dockResizeHandle" ||

            (
                event.clientX >= rect.right - 24 &&
                event.clientY >= rect.bottom - 24
            )
        );

    }


    dock.addEventListener(
        "pointerdown",
        event => {

            if (!isResizeGrip(event)) return;


            isResizing = true;


            startX =
                event.clientX;

            startY =
                event.clientY;


            startWidth =
                dock.offsetWidth;

            startHeight =
                dock.offsetHeight;


            dock.classList.add("resizing");


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


            const maxH =
                window.innerHeight * 0.92;


            const newWidth =
                Math.min(
                    MAX_WIDTH,
                    Math.max(
                        MIN_WIDTH,
                        startWidth +
                        (
                            event.clientX -
                            startX
                        )
                    )
                );


            const newHeight =
                Math.min(
                    maxH,
                    Math.max(
                        MIN_HEIGHT,
                        startHeight +
                        (
                            event.clientY -
                            startY
                        )
                    )
                );


            dock.style.width =
                `${newWidth}px`;


            dock.style.height =
                `${newHeight}px`;

        }
    );


    const stopResize = event => {

        if (!isResizing) return;


        isResizing = false;


        dock.classList.remove(
            "resizing"
        );


        try {

            dock.releasePointerCapture(
                event.pointerId
            );

        } catch (_) {}


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


/* =====================================================
   INITIALIZE RESIZER
===================================================== */

if (
    document.readyState === "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initDockResizer
    );

} else {

    initDockResizer();

}


/* =====================================================
   BUTTON SELECTION
===================================================== */

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
            .forEach(btn => {

                btn.classList.remove(
                    "selected"
                );

            });

    }


    /* ================================================
       DESELECT
    ================================================= */

    if (wasSelected) {

        hideNotification();

        setStatus(
            `${name} deselected`
        );

        return;

    }


    /* ================================================
       SELECT
    ================================================= */

    button.classList.add(
        "selected"
    );


    showNotification(name);

    setStatus(
        `${name} selected`
    );

}


/* =====================================================
   ACTION BUTTONS
===================================================== */

function performAction(
    id,
    name
) {

    document
        .querySelectorAll(
            ".tool-button.selected"
        )
        .forEach(button => {

            button.classList.remove(
                "selected"
            );

        });


    showNotification(name);

    setStatus(
        `Action: ${name}`
    );

}


/* =====================================================
   NOTIFICATION
===================================================== */

let statusTimer;
let notifTimer;


function showNotification(name) {

    const notif =
        document.getElementById(
            "toolNotification"
        );


    const text =
        document.getElementById(
            "notificationText"
        );


    if (!notif || !text) return;


    text.textContent = name;


    notif.classList.add("show");


    clearTimeout(notifTimer);


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


/* =====================================================
   HIDE NOTIFICATION
===================================================== */

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


/* =====================================================
   STATUS
===================================================== */

function setStatus(message) {

    const status =
        document.getElementById(
            "statusText"
        );


    if (!status) return;


    status.textContent =
        message;


    clearTimeout(statusTimer);


    statusTimer =
        setTimeout(
            () => {

                status.textContent =
                    "Terrain editor ready";

            },
            2500
        );

}


/* =====================================================
   GLOBAL WINDOW ATTACHMENTS
===================================================== */

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

