import ms from "milsymbol";

// =============================================================
// actions.js - Map & Feature Logic (Cesium / Custom Behaviors)
// Plug in your custom feature functions here. Your teammates 
// can add new tools here without touching script.js or UI code.
// =============================================================

export const toolActions = {
    // ---------------------------------------------------------
    // 1. TERRAIN VIEW TOOLS
    // ---------------------------------------------------------
    "terrainExaggeration": (value) => {
        console.log(`[Cesium Action] Setting terrain exaggeration to ${value}`);
    },

    "elevationColours": (enabled) => {
        console.log(`[Cesium Action] Elevation colours: ${enabled ? "ON" : "OFF"}`);
    },

    "slopeShading": (enabled) => {
        console.log(`[Cesium Action] Slope shading: ${enabled ? "ON" : "OFF"}`);
    },

    "contours": (enabled) => {
        console.log(`[Cesium Action] Contours: ${enabled ? "ON" : "OFF"}`);
    },

    "waterLevel": (value) => {
        console.log(`[Cesium Action] Water level adjusted to: ${value}`);
    },

    // ---------------------------------------------------------
    // 2. SCULPT BRUSH TOOLS
    // ---------------------------------------------------------
    "modifyTerrain": (enabled) => {
        console.log(`[Cesium Action] Modify terrain mode: ${enabled ? "ACTIVE" : "INACTIVE"}`);
    },

    "brushRaise": (enabled) => {
        console.log(`[Cesium Action] Brush mode RAISE: ${enabled ? "ACTIVE" : "INACTIVE"}`);
    },

    "radius": (value) => {
        console.log(`[Cesium Action] Brush radius set to: ${value}m`);
    },

    "power": (value) => {
        console.log(`[Cesium Action] Brush power set to: ${value}m`);
    },

    "maxHeight": (value) => {
        console.log(`[Cesium Action] Max height set to: ${value}m`);
    },

    "undo": () => {
        console.log("[Cesium Action] Undo last terrain modification.");
    },

    "redo": () => {
        console.log("[Cesium Action] Redo last terrain modification.");
    },

    "resetTerrain": () => {
        console.log("[Cesium Action] Resetting entire terrain to default state.");
    },

    // ---------------------------------------------------------
    // 3. SHAPING TOOLS
    // ---------------------------------------------------------
    "gradeRoad": (enabled) => {
        console.log(`[Cesium Action] Grade road path: ${enabled ? "ON" : "OFF"}`);
    },

    "gradeFlatten": (enabled) => {
        console.log(`[Cesium Action] Grade flatten: ${enabled ? "ON" : "OFF"}`);
    },

    "pathWidth": (value) => {
        console.log(`[Cesium Action] Path width set to: ${value}m`);
    },

    "digDepth": (value) => {
        console.log(`[Cesium Action] Dig depth set to: ${value}m`);
    },

    "stampDome": () => {
        console.log("[Cesium Action] Stamping dome structure onto terrain.");
    },

    "crossSection": () => {
        console.log("[Cesium Action] Generating cross-section view.");
    },

    "regionOffset": () => {
        console.log("[Cesium Action] Applying region offset.");
    },

    "regionUp": () => {
        console.log("[Cesium Action] Moving region UP.");
    },

    "regionDown": () => {
        console.log("[Cesium Action] Moving region DOWN.");
    },

    // ---------------------------------------------------------
    // 4. EROSION / EARTHWORK TOOLS
    // ---------------------------------------------------------
    "erodeWater": (enabled) => {
        console.log(`[Cesium Action] Water erosion simulation: ${enabled ? "RUNNING" : "STOPPED"}`);
    },

    "talus": (enabled) => {
        console.log(`[Cesium Action] Talus simulation: ${enabled ? "ON" : "OFF"}`);
    },

    "balanceCutFill": () => {
        console.log("[Cesium Action] Calculating balanced cut and fill volumes.");
    },

    // ---------------------------------------------------------
    // 5. EXTENSIBILITY SLOT
    // ---------------------------------------------------------
    "deployRadar": (enabled) => {
        const rangeInput = document.querySelector('input[data-tool-id="radarRange"]');
        const rangeValue = rangeInput ? rangeInput.value : 5000;
        console.log(`[Cesium Action] Deploying Radar. Range: ${rangeValue}m, Active: ${enabled}`);
    },

    "spawnTank": () => {
        console.log("[Cesium Action] Spawning tactical tank model on map...");
    },

    // ---------------------------------------------------------
    // 6. SYMBOL PLACEMENT HANDLER
    // ---------------------------------------------------------
    // ---------------------------------------------------------
    // 6. SYMBOL PLACEMENT HANDLER (Using milsymbol)
    // ---------------------------------------------------------
    "symbol": (data) => {
        if (!data || !data.symbol || !data.map) return;

        const { map, latlng, symbol } = data;
        const { name, sidc } = symbol;

        // Container styled for a standing marker (Symbol on top, Name below)
        const container = document.createElement('div');
        container.className = 'placed-tactical-symbol';
        container.style.cssText = `
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
            pointer-events: none;
            white-space: nowrap;
        `;

        // Wrapper for the standing military symbol graphic
        const iconWrapper = document.createElement('div');
        iconWrapper.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: center;
            filter: drop-shadow(0 3px 4px rgba(0,0,0,0.5));
            margin-bottom: 4px;
        `;

        const milsymbolLib = window.ms || (typeof ms !== 'undefined' ? ms : null);

        if (sidc && milsymbolLib) {
            try {
                // Render a larger standing military icon size
                const milSymbolInstance = new milsymbolLib.Symbol(sidc, { size: 45 });
                const svgElement = milSymbolInstance.asDOM();
                if (svgElement) {
                    iconWrapper.appendChild(svgElement);
                } else {
                    iconWrapper.innerHTML = milSymbolInstance.asSVG();
                }
            } catch (e) {
                console.warn("[Symbol Action] Failed to render milsymbol:", sidc, e);
                iconWrapper.textContent = '[ERR]';
            }
        } else {
            iconWrapper.textContent = '[ICON]';
        }

        // Label box for the name underneath the symbol
        const labelWrapper = document.createElement('div');
        labelWrapper.style.cssText = `
            background: rgba(15, 23, 42, 0.9);
            border: 1px solid #38bdf8;
            color: #f8fafc;
            padding: 2px 8px;
            border-radius: 4px;
            font-family: monospace;
            font-size: 11px;
            font-weight: bold;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        `;
        labelWrapper.textContent = name;

        container.appendChild(iconWrapper);
        container.appendChild(labelWrapper);

        // Anchor the bottom center so it stands accurately on the map click coordinate
        const customIcon = L.divIcon({
            className: 'custom-symbol-marker',
            html: container,
            iconSize: [100, 70],
            iconAnchor: [50, 70]
        });

        L.marker([latlng.lat, latlng.lng], { icon: customIcon }).addTo(map);

        if (typeof window.setStatus === "function") {
            window.setStatus(`Placed: ${name} at [${latlng.lat.toFixed(4)}, ${latlng.lng.toFixed(4)}]`);
        }
    }
};