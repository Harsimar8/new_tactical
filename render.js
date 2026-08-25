import ms from "milsymbol";

document.addEventListener("DOMContentLoaded", async () => {
    try {

        // =====================================================
        // 1. INITIALIZE MAP
        // =====================================================

        const map = L.map("map", {
            zoomControl: false
        }).setView([30.9010, 75.8573], 13);

        L.tileLayer(
            "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
            {
                maxZoom: 19,
                attribution: "&copy; OpenStreetMap contributors"
            }
        ).addTo(map);

        window.tacticalMap = map;


        // =====================================================
        // 2. LOAD TOOLS.JSON
        // =====================================================

        const response = await fetch("tools.json");
        const data = await response.json();

        window.terrainToolData = data;


        // =====================================================
        // 3. RENDER UI
        // =====================================================

        renderHeader(data.panel);
        renderRail(data.sections);
        renderSections(data.sections);
        initRailScrolling();


        // =====================================================
        // 4. DEFAULT SECTION
        // =====================================================

        const defaultSection =
            data.sections.find(section => section.id === "symbols") ||
            data.sections[0];

        if (defaultSection) {

            const defaultButton =
                document.querySelector(
                    `.rail-btn[data-id="${defaultSection.id}"]`
                );

            if (defaultButton && window.switchSection) {
                window.switchSection(defaultSection.id, defaultButton);
            }
        }


        // =====================================================
        // 5. DRAG PANEL
        // =====================================================

        initDockDragging();

    } catch (error) {

        console.error(
            "Failed to load tools.json or initialize map:",
            error
        );

    }
});


// =============================================================
// HEADER
// =============================================================

function renderHeader(panelData) {

    const headerContainer =
        document.getElementById("panelHeaderContainer");

    if (!headerContainer) return;

    headerContainer.innerHTML = `

        <div class="panel-header">

            <div class="panel-brand">

                <div class="brand-mark">
                    ${panelData.icon || "◈"}
                </div>

                <div class="brand-text">

                    <div class="panel-title">
                        ${panelData.title || "TACTICAL SUITE"}
                    </div>

                    <div class="panel-subtitle">
                        ${panelData.subtitle || "TACTICAL SYSTEM"}
                    </div>

                </div>

            </div>

            <button
                class="panel-menu"
                title="Close"
                onclick="closeTacticalPanel()"
            >
                ×
            </button>

        </div>
    `;
}


// =============================================================
// HORIZONTAL CATEGORY RAIL
// =============================================================

function renderRail(sections) {

    const rail =
        document.getElementById("categoryRail");

    if (!rail) return;

    let html = `

        <div class="rail-logo">

            <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
            >

                <polygon
                    points="12 2 2 7 12 12 22 7 12 2"
                />

                <polyline
                    points="2 17 12 22 22 17"
                />

                <polyline
                    points="2 12 12 17 22 12"
                />

            </svg>

        </div>
    `;


    // =========================================================
    // CREATE HORIZONTAL CATEGORY BUTTONS
    // =========================================================

    sections.forEach(section => {

        html += `

            <button
                class="rail-btn"
                data-id="${section.id}"
                data-tooltip="${section.title}"
                title="${section.title}"
                aria-label="Open ${section.title}"
                onclick="switchSection('${section.id}', this)"
            >

                <span class="rail-icon" aria-hidden="true">
                    ${section.icon || "◈"}
                </span>

            </button>

        `;
    });


    rail.innerHTML = html + `
        <button class="rail-close" title="Close panel" aria-label="Close panel" onclick="closeTacticalPanel()">×</button>
    `;
}

function initRailScrolling() {
    const rail = document.getElementById("categoryRail");
    if (!rail) return;

    let startX = 0;
    let startScroll = 0;
    let dragged = false;
    let pointerId = null;

    rail.addEventListener("pointerdown", event => {
        if (!event.target.closest(".rail-btn")) return;
        startX = event.clientX;
        startScroll = rail.scrollLeft;
        dragged = false;
        pointerId = event.pointerId;
    });

    rail.addEventListener("pointermove", event => {
        if (event.pointerId !== pointerId) return;
        const distance = event.clientX - startX;
        if (Math.abs(distance) > 4 && !dragged) {
            dragged = true;
            rail.setPointerCapture(event.pointerId);
            rail.classList.add("is-dragging");
        }
        if (dragged) rail.scrollLeft = startScroll - distance;
    });

    const stopDragging = event => {
        if (dragged && rail.hasPointerCapture(event.pointerId)) {
            rail.releasePointerCapture(event.pointerId);
        }
        pointerId = null;
        rail.classList.remove("is-dragging");
    };

    rail.addEventListener("pointerup", stopDragging);
    rail.addEventListener("pointercancel", stopDragging);

    rail.addEventListener("click", event => {
        if (!dragged) return;
        event.preventDefault();
        event.stopPropagation();
        dragged = false;
    }, true);

    rail.addEventListener("pointerover", event => {
        const button = event.target.closest(".rail-btn");
        if (!button || button.contains(event.relatedTarget)) return;
        const tip = document.createElement("div");
        tip.className = "rail-tooltip";
        tip.textContent = button.dataset.tooltip;
        const rect = button.getBoundingClientRect();
        tip.style.left = `${rect.left + rect.width / 2}px`;
        tip.style.top = `${rect.bottom + 8}px`;
        document.body.appendChild(tip);
        button._railTooltip = tip;
    });

    rail.addEventListener("pointerout", event => {
        const button = event.target.closest(".rail-btn");
        if (button && !button.contains(event.relatedTarget)) {
            button._railTooltip?.remove();
            button._railTooltip = null;
        }
    });
}


// =============================================================
// RENDER ALL SECTIONS
// =============================================================

function renderSections(sections) {

    const container =
        document.getElementById("dynamicPanelContent");

    if (!container) return;

    container.innerHTML = "";


    sections.forEach(section => {

        const sectionEl =
            document.createElement("div");

        sectionEl.id =
            `section-${section.id}`;

        sectionEl.className =
            "drawer-section";

        sectionEl.dataset.section =
            section.id;

        sectionEl.style.display = "none";


        // =====================================================
        // SECTION TITLE
        // =====================================================

        let html = `

            <div class="drawer-section-header">

                <div class="drawer-section-title">

                    <span class="sec-icon">
                        ${section.icon || "◈"}
                    </span>

                    <span>
                        ${section.title}
                    </span>

                </div>

            </div>

        `;


        // =====================================================
        // SYMBOLS
        // =====================================================

        if (section.id === "symbols") {

            html += `

                <div class="search-box">

                    <span class="search-icon">
                        🔍
                    </span>

                    <input
                        type="text"
                        id="symbolSearch"
                        class="search-input"
                        placeholder="Search radar, SAM, tank..."
                        onkeyup="filterCards()"
                    >

                </div>


                <div
                    class="filter-pills"
                    id="symbolFilterPills"
                >

                    <button
                        class="filter-pill active"
                        onclick="filterCategory('all', this)"
                    >
                        ALL
                    </button>

            `;


            let allSymbols = [];


            section.items.forEach(category => {

                if (category.symbols) {

                    html += `

                        <button
                            class="filter-pill"
                            onclick="filterCategory(
                                '${category.id}',
                                this
                            )"
                        >
                            ${category.label.toUpperCase()}
                        </button>

                    `;


                    category.symbols.forEach(symbol => {

                        allSymbols.push({

                            ...symbol,

                            categoryId:
                                category.id,

                            categoryLabel:
                                category.label

                        });

                    });

                }

            });


            html += `

                </div>

                <div class="symbol-card-grid">

            `;


            // =================================================
            // SYMBOL CARDS
            // =================================================

            allSymbols.forEach(symbol => {

                const svgIcon =
                    createMilSymbolSVG(
                        symbol.sidc,
                        34
                    );


                html += `

                    <div
                        class="tactical-symbol-card"
                        data-category="${symbol.categoryId}"
                        data-name="${symbol.name}"
                        onclick="selectSymbolCard(
                            this,
                            '${symbol.name}',
                            '${symbol.sidc}'
                        )"
                    >

                        <div class="card-top">

                            <span class="card-tag">
                                ${symbol.categoryLabel.toUpperCase()}
                            </span>

                            <span class="status-led"></span>

                        </div>


                        <div class="card-glyph-box">

                            ${svgIcon}

                        </div>


                        <div class="card-bottom">

                            <span class="card-label">
                                ${symbol.name}
                            </span>

                        </div>

                    </div>

                `;

            });


            html += `</div>`;

        }


        // =====================================================
        // OTHER SECTIONS
        // =====================================================

        else {

            let buttonGridActive = false;
            let buttonIndex = 0;


            section.items.forEach((item, index) => {

                const isWide =
                    item.wide ? " wide" : "";


                // =================================================
                // BUTTON / MODE
                // =================================================

                if (
                    item.type === "button" ||
                    item.type === "mode"
                ) {

                    if (!buttonGridActive) {

                        html += `
                            <div class="button-grid">
                        `;

                        buttonGridActive = true;
                        buttonIndex = 0;
                    }

                    const buttonSide =
                        buttonIndex++ % 2
                            ? " button-right"
                            : " button-left";


                    const isReset =
                        (item.id || "")
                            .toLowerCase()
                            .includes("reset") ||

                        (item.label || "")
                            .toLowerCase()
                            .includes("reset");


                    const dangerClass =
                        isReset
                            ? " danger-action"
                            : "";


                    const isAction =
                        (item.id || "")
                            .toLowerCase()
                            .includes("undo") ||

                        (item.id || "")
                            .toLowerCase()
                            .includes("redo") ||

                        isReset;


                    const clickAction =
                        isAction

                            ? `performAction(
                                '${item.id || item.label}',
                                '${item.label}'
                              )`

                            : `selectOption(
                                this,
                                '${item.id}',
                                '${item.label}'
                              )`;


                    html += `

                        <button
                            class="tool-button${isWide}${dangerClass}${buttonSide}"
                            onclick="${clickAction}"
                        >

                            <span class="button-icon">
                                ${item.icon || "◈"}
                            </span>

                            <span>
                                ${item.label}
                            </span>

                        </button>

                    `;
                }


                // =================================================
                // TOGGLE
                // =================================================

                else if (item.type === "toggle") {

                    if (buttonGridActive) {

                        html += `</div>`;

                        buttonGridActive = false;
                    }


                    const onText =
                        item.onLabel ||
                        `${item.label}: ON`;


                    const offText =
                        item.offLabel ||
                        `${item.label}: OFF`;


                    html += `

                        <button
                            id="${item.id}Button"
                            class="tactical-toggle-btn${isWide}"
                            data-enabled="${item.value}"
                            onclick="toggleMaskSetting(
                                this,
                                '${item.id}',
                                '${onText}',
                                '${offText}'
                            )"
                        >

                            <span class="toggle-text">
                                ${
                                    item.value
                                        ? onText
                                        : offText
                                }
                            </span>

                            <div class="toggle-indicator"></div>

                        </button>

                    `;
                }


                // =================================================
                // NUMBER / SLIDER
                // =================================================

                else if (item.type === "number") {

                    if (buttonGridActive) {

                        html += `</div>`;

                        buttonGridActive = false;
                    }


                    let minVal = 0;

                    let maxVal =
                        item.id === "radius"
                            ? 5000
                            : item.id === "power"
                            ? 50
                            : item.id === "maxHeight"
                            ? 2000
                            : 1000;


                    if (item.id === "radius") {
                        minVal = 100;
                    }


                    html += `

                        <div class="slider-control-card">

                            <div class="slider-top-row">

                                <span class="slider-label">
                                    ${item.label}
                                </span>

                                <span
                                    class="slider-number"
                                    id="${item.id}Value"
                                >
                                    ${item.value}
                                    ${item.unit || ""}
                                </span>

                            </div>


                            <div class="slider-bottom-row">

                                <button
                                    class="mini-stepper-btn"
                                    onclick="stepValue(
                                        '${item.id}',
                                        -${item.step || 1},
                                        '${item.unit || ""}'
                                    )"
                                >
                                    −
                                </button>


                                <input
                                    type="range"
                                    class="cyber-range-input"
                                    id="${item.id}Slider"
                                    min="${minVal}"
                                    max="${maxVal}"
                                    step="${item.step || 1}"
                                    value="${item.value}"
                                    oninput="sliderChange(
                                        '${item.id}',
                                        this.value,
                                        '${item.unit || ""}'
                                    )"
                                >


                                <button
                                    class="mini-stepper-btn"
                                    onclick="stepValue(
                                        '${item.id}',
                                        ${item.step || 1},
                                        '${item.unit || ""}'
                                    )"
                                >
                                    +
                                </button>

                            </div>

                        </div>

                    `;
                }


                // =================================================
                // CLOSE BUTTON GRID
                // =================================================

                if (
                    index === section.items.length - 1 &&
                    buttonGridActive
                ) {

                    html += `</div>`;

                }

            });

        }


        // =====================================================
        // ADD SECTION TO DOM
        // =====================================================

        sectionEl.innerHTML = html;

        container.appendChild(sectionEl);

    });
}


// =============================================================
// MILSYMBOL SVG
// =============================================================

function createMilSymbolSVG(sidc, size = 34) {

    if (
        typeof ms !== "undefined" &&
        ms.Symbol
    ) {

        return new ms.Symbol(
            sidc,
            {
                size: size
            }
        ).asSVG();

    }


    return `

        <svg
            width="${size}"
            height="${size}"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#66c7a5"
            stroke-width="2"
        >

            <circle
                cx="12"
                cy="12"
                r="8"
            />

            <path d="M12 2v20"/>

            <path d="M2 12h20"/>

        </svg>

    `;
}


// =============================================================
// PANEL DRAGGING
// =============================================================

function initDockDragging() {

    const dock =
        document.querySelector(
            ".tactical-menu-dock"
        );

    const header =
        document.querySelector(
            ".category-rail"
        );


    if (!dock || !header) return;


    let isDragging = false;

    let startX = 0;
    let startY = 0;

    let initialLeft = 0;
    let initialTop = 0;


    header.style.cursor = "move";


    header.addEventListener(
        "mousedown",
        event => {

            if (event.target.closest(".rail-btn, .rail-close")) {
                return;
            }


            isDragging = true;

            startX = event.clientX;
            startY = event.clientY;


            const rect =
                dock.getBoundingClientRect();


            initialLeft = rect.left;
            initialTop = rect.top;


            dock.style.position = "fixed";

            dock.style.left =
                `${initialLeft}px`;

            dock.style.top =
                `${initialTop}px`;


            document.addEventListener(
                "mousemove",
                onMouseMove
            );

            document.addEventListener(
                "mouseup",
                onMouseUp
            );

        }
    );


    function onMouseMove(event) {

        if (!isDragging) return;


        const dx =
            event.clientX - startX;

        const dy =
            event.clientY - startY;


        dock.style.left =
            `${initialLeft + dx}px`;

        dock.style.top =
            `${initialTop + dy}px`;
    }


    function onMouseUp() {

        isDragging = false;


        document.removeEventListener(
            "mousemove",
            onMouseMove
        );

        document.removeEventListener(
            "mouseup",
            onMouseUp
        );

    }

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


    dock.classList.remove("panel-open");


    document
        .querySelectorAll(".rail-btn")
        .forEach(button => {

            button.classList.remove("active");

        });


    document
        .querySelectorAll(".drawer-section")
        .forEach(section => {

            section.style.display = "none";

        });

}


// =============================================================
// GLOBAL FUNCTIONS
// =============================================================

window.closeTacticalPanel =
    closeTacticalPanel;

