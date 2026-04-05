// Settings page logic

// Map of layoutId -> function that refreshes the corresponding Live Test button label.
const testButtonUpdaters = new Map();

// Load settings when page loads
document.addEventListener("DOMContentLoaded", async () => {
    populateBuiltInLayouts();
    await loadSettings();
    setupEventListeners();
    await populateTestSection();
});

/**
 * Load settings from Chrome storage
 */
async function loadSettings() {
    const settings = await chrome.storage.sync.get(null);

    // Build default shortcut entries from the layout definitions so adding a new
    // built-in layout only requires updating layouts.js.
    const shortcutDefaults = {};
    for (const layoutId of getAvailableLayouts()) {
        shortcutDefaults[`shortcut-${layoutId}`] = getDefaultShortcut(layoutId);
    }

    const defaults = {
        enabledLayouts: [getAvailableLayouts()[0]],
        ...shortcutDefaults,
        "shortcut-auto-switch": getAutoSwitchDefaultShortcut(),
        customLayouts: {},
    };
    const merged = { ...defaults, ...settings };

    // Restore enabled layouts
    merged.enabledLayouts.forEach((layoutId) => {
        const checkbox = document.getElementById(`layout-${layoutId}`);
        if (checkbox) {
            checkbox.checked = true;
            // Custom layouts are wrapped in a .custom-layout-card; built-ins use .shortcut-item directly.
            const container = checkbox.closest(".custom-layout-card") ?? checkbox.closest(".shortcut-item");
            container?.classList.add("enabled");
        }
    });

    // Restore auto-switch shortcut
    const autoShortcut = merged["shortcut-auto-switch"];
    document.getElementById("autoCtrl").checked = autoShortcut.ctrl;
    document.getElementById("autoShift").checked = autoShortcut.shift;
    document.getElementById("autoAlt").checked = autoShortcut.alt || false;
    document.getElementById("autoKey").value = autoShortcut.key;
    const autoEnabledChecked = merged["autoEnabled"] !== false;
    document.getElementById("autoEnabled").checked = autoEnabledChecked;
    document.getElementById("auto-switch-row").classList.toggle("enabled", autoEnabledChecked);

    // Load custom layouts and restore their shortcuts
    if (Object.keys(merged.customLayouts).length > 0) {
        Object.entries(merged.customLayouts).forEach(([id, config]) => {
            addCustomLayout(id, config);
            displayCustomLayout(id, config);
            // Restore saved shortcut for this custom layout if present
            const sc = merged[`shortcut-${id}`];
            if (sc) {
                const ctrl = document.getElementById(`shortcut-${id}-ctrl`);
                const shift = document.getElementById(`shortcut-${id}-shift`);
                const alt = document.getElementById(`shortcut-${id}-alt`);
                const key = document.getElementById(`shortcut-${id}-key`);
                const dirBtn = document.getElementById(`shortcut-${id}-direction`);
                const strongLabel = document.getElementById(`shortcut-${id}-label`);
                const helpLabel = document.getElementById(`shortcut-${id}-helplabel`);
                if (ctrl) ctrl.checked = sc.ctrl;
                if (shift) shift.checked = sc.shift;
                if (alt) alt.checked = sc.alt || false;
                if (key) key.value = sc.key || "";
                if (dirBtn) applyDirectionUI(dirBtn, strongLabel, helpLabel, sc.direction || "auto");
            }
        });
    }

    return merged;
}

/**
 * Populate built-in layouts section
 */
function populateBuiltInLayouts() {
    const shortcutsContainer = document.getElementById("shortcutsContainer");
    const availableLayouts = getAvailableLayouts();

    availableLayouts.forEach((layoutId) => {
        if (document.getElementById(`layout-row-${layoutId}`)) return;
        const config = getLayoutConfig(layoutId);
        const layoutKeys = Object.keys(config.layouts);
        const layout1Name = config.layouts[layoutKeys[0]].name;
        const layout2Name = config.layouts[layoutKeys[1]].name;

        const row = document.createElement("div");
        row.className = "shortcut-item";
        row.id = `layout-row-${layoutId}`;
        row.innerHTML = `
      <label class="layout-row-checkbox-label" title="Enable this layout">
        <input type="checkbox" id="layout-${layoutId}" value="${layoutId}">
      </label>
      <div class="layout-label-block">
        <strong id="shortcut-${layoutId}-label">${layout1Name} ↔ ${layout2Name}</strong>
        <span class="help-text" id="shortcut-${layoutId}-helplabel">Auto-detects direction</span>
      </div>
      <button type="button" class="direction-toggle" id="shortcut-${layoutId}-direction"
        data-direction="auto"
        data-name1="${layout1Name}" data-name2="${layout2Name}"
        title="Auto-detect direction">&#8596;</button>
      <div class="vertical-divider"></div>
      <div class="shortcut-input-group">
        <label><input type="checkbox" id="shortcut-${layoutId}-ctrl"> Ctrl</label>
        <label><input type="checkbox" id="shortcut-${layoutId}-shift"> Shift</label>
        <label><input type="checkbox" id="shortcut-${layoutId}-alt"> Alt</label>
        <input type="text" id="shortcut-${layoutId}-key" maxlength="1" placeholder="Key">
      </div>
    `;

        // Apply default shortcut values from the layout definition
        const defaultSc = config.defaultShortcut ?? {};
        row.querySelector(`#shortcut-${layoutId}-ctrl`).checked = defaultSc.ctrl ?? false;
        row.querySelector(`#shortcut-${layoutId}-shift`).checked = defaultSc.shift ?? false;
        row.querySelector(`#shortcut-${layoutId}-alt`).checked = defaultSc.alt ?? false;
        row.querySelector(`#shortcut-${layoutId}-key`).value = defaultSc.key ?? "";
        row.querySelector(`#layout-${layoutId}`).addEventListener("change", (e) => {
            row.classList.toggle("enabled", e.target.checked);
        });

        const dirBtn = row.querySelector(`#shortcut-${layoutId}-direction`);
        const strongLabel = row.querySelector(`#shortcut-${layoutId}-label`);
        const helpLabel = row.querySelector(`#shortcut-${layoutId}-helplabel`);
        applyDirectionUI(dirBtn, strongLabel, helpLabel, "auto");
        dirBtn.addEventListener("click", () => {
            let next;
            if (dirBtn.dataset.direction === "auto") {
                next = "forward";
            } else if (dirBtn.dataset.direction === "forward") {
                next = "reverse";
            } else {
                next = "auto";
            }
            applyDirectionUI(dirBtn, strongLabel, helpLabel, next);
        });

        wireKeyInput(row.querySelector(`#shortcut-${layoutId}-key`));
        shortcutsContainer.appendChild(row);
    });

    // Load saved shortcuts
    chrome.storage.sync.get(null, (settings) => {
        availableLayouts.forEach((layoutId) => {
            const shortcutKey = `shortcut-${layoutId}`;
            if (settings[shortcutKey]) {
                const shortcut = settings[shortcutKey];
                document.getElementById(`shortcut-${layoutId}-ctrl`).checked = shortcut.ctrl;
                document.getElementById(`shortcut-${layoutId}-shift`).checked = shortcut.shift;
                document.getElementById(`shortcut-${layoutId}-alt`).checked = shortcut.alt || false;
                document.getElementById(`shortcut-${layoutId}-key`).value = shortcut.key;
                const dirBtn = document.getElementById(`shortcut-${layoutId}-direction`);
                const strongLabel = document.getElementById(`shortcut-${layoutId}-label`);
                const helpLabel = document.getElementById(`shortcut-${layoutId}-helplabel`);
                if (dirBtn) applyDirectionUI(dirBtn, strongLabel, helpLabel, shortcut.direction || "auto");
            }
        });
    });
}

/**
 * Update the direction toggle button, strong label, and help text to reflect the given direction.
 * @param {HTMLElement} btn
 * @param {HTMLElement} strongLabel
 * @param {HTMLElement} helpLabel
 * @param {"auto"|"forward"|"reverse"} direction
 */
const DIR_ICONS = {
    forward: `<svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 16 16" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M10.146 4.646a.5.5 0 01.708 0l3 3a.5.5 0 010 .708l-3 3a.5.5 0 01-.708-.708L12.793 8l-2.647-2.646a.5.5 0 010-.708z" clip-rule="evenodd"></path><path fill-rule="evenodd" d="M2 8a.5.5 0 01.5-.5H13a.5.5 0 010 1H2.5A.5.5 0 012 8z" clip-rule="evenodd"></path></svg>`,
    reverse: `<svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 16 16" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M5.854 4.646a.5.5 0 010 .708L3.207 8l2.647 2.646a.5.5 0 01-.708.708l-3-3a.5.5 0 010-.708l3-3a.5.5 0 01.708 0z" clip-rule="evenodd"></path><path fill-rule="evenodd" d="M2.5 8a.5.5 0 01.5-.5h10.5a.5.5 0 010 1H3a.5.5 0 01-.5-.5z" clip-rule="evenodd"></path></svg>`,
    auto: `<svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 16 16" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M10.146 7.646a.5.5 0 01.708 0l3 3a.5.5 0 010 .708l-3 3a.5.5 0 01-.708-.708L12.793 11l-2.647-2.646a.5.5 0 010-.708z" clip-rule="evenodd"></path><path fill-rule="evenodd" d="M2 11a.5.5 0 01.5-.5H13a.5.5 0 010 1H2.5A.5.5 0 012 11zm3.854-9.354a.5.5 0 010 .708L3.207 5l2.647 2.646a.5.5 0 11-.708.708l-3-3a.5.5 0 010-.708l3-3a.5.5 0 01.708 0z" clip-rule="evenodd"></path><path fill-rule="evenodd" d="M2.5 5a.5.5 0 01.5-.5h10.5a.5.5 0 010 1H3a.5.5 0 01-.5-.5z" clip-rule="evenodd"></path></svg>`,
};

function applyDirectionUI(btn, strongLabel, helpLabel, direction) {
    const name1 = btn.dataset.name1;
    const name2 = btn.dataset.name2;
    btn.dataset.direction = direction;
    if (direction === "forward") {
        btn.innerHTML = DIR_ICONS.forward;
        btn.title = `${name1} → ${name2} only`;
        btn.classList.remove("dir-reverse", "dir-auto");
        btn.classList.add("dir-forward");
        if (strongLabel) strongLabel.innerHTML = `${name1} ${DIR_ICONS.forward} ${name2}`;
        if (helpLabel) helpLabel.textContent = `Always converts ${name1} → ${name2}`;
    } else if (direction === "reverse") {
        btn.innerHTML = DIR_ICONS.reverse;
        btn.title = `${name2} → ${name1} only`;
        btn.classList.remove("dir-forward", "dir-auto");
        btn.classList.add("dir-reverse");
        if (strongLabel) strongLabel.innerHTML = `${name2} ${DIR_ICONS.forward} ${name1}`;
        if (helpLabel) helpLabel.textContent = `Always converts ${name2} → ${name1}`;
    } else {
        btn.innerHTML = DIR_ICONS.auto;
        btn.title = "Auto-detect direction";
        btn.classList.remove("dir-forward", "dir-reverse");
        btn.classList.add("dir-auto");
        if (strongLabel) strongLabel.innerHTML = `${name1} ${DIR_ICONS.auto} ${name2}`;
        if (helpLabel) helpLabel.textContent = "Auto-detects direction";
    }
}

/**
 * Wire a key-capture listener onto a shortcut key text input.
 * Captures the raw key (e.g. "1", "a") from e.code regardless of Shift state.
 */
function wireKeyInput(input) {
    if (!input) return;
    input.addEventListener("keydown", (e) => {
        e.preventDefault();
        let key = "";
        if (/^Digit(\d)$/.test(e.code)) {
            key = e.code.replace("Digit", "");
        } else if (/^Key([A-Z])$/.test(e.code)) {
            key = e.code.replace("Key", "").toLowerCase();
        } else if (e.key.length === 1) {
            key = e.key;
        }
        if (key) e.target.value = key;
    });
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Save settings button
    document.getElementById("saveSettings").addEventListener("click", saveSettings);

    // Add custom layout button
    document.getElementById("addCustomLayout").addEventListener("click", handleAddCustomLayout);

    // Wire the auto-switch key input
    wireKeyInput(document.getElementById("autoKey"));

    // Wire the auto-enabled checkbox
    document.getElementById("autoEnabled").addEventListener("change", (e) => {
        document.getElementById("auto-switch-row").classList.toggle("enabled", e.target.checked);
    });
}

/**
 * Save all settings
 */
async function saveSettings() {
    const saveButton = document.getElementById("saveSettings");
    const saveStatus = document.getElementById("saveStatus");

    saveButton.disabled = true;
    saveStatus.textContent = "Saving...";
    saveStatus.className = "save-status";

    try {
        // Get enabled layouts
        const enabledLayouts = [];
        document.querySelectorAll('[id^="layout-"]:checked').forEach((checkbox) => {
            enabledLayouts.push(checkbox.value);
        });

        // Get shortcuts
        const shortcuts = {};
        const availableLayouts = getAvailableLayouts();

        availableLayouts.forEach((layoutId) => {
            const ctrl = document.getElementById(`shortcut-${layoutId}-ctrl`);
            const shift = document.getElementById(`shortcut-${layoutId}-shift`);
            const alt = document.getElementById(`shortcut-${layoutId}-alt`);
            const key = document.getElementById(`shortcut-${layoutId}-key`);
            const dirBtn = document.getElementById(`shortcut-${layoutId}-direction`);

            if (ctrl && shift && key) {
                shortcuts[`shortcut-${layoutId}`] = {
                    ctrl: ctrl.checked,
                    shift: shift.checked,
                    alt: alt ? alt.checked : false,
                    key: key.value || "1",
                    direction: dirBtn ? dirBtn.dataset.direction : "auto",
                };
            }
        });

        // Auto-switch shortcut
        shortcuts["shortcut-auto-switch"] = {
            ctrl: document.getElementById("autoCtrl").checked,
            shift: document.getElementById("autoShift").checked,
            alt: document.getElementById("autoAlt").checked,
            key: document.getElementById("autoKey").value || getAutoSwitchDefaultShortcut().key,
            direction: "auto",
        };

        // Get custom layouts from storage (they're already saved individually)
        const currentSettings = await chrome.storage.sync.get(["customLayouts"]);

        // Save to Chrome storage
        await chrome.storage.sync.set({
            enabledLayouts,
            autoEnabled: document.getElementById("autoEnabled").checked,
            ...shortcuts,
            customLayouts: currentSettings.customLayouts || {},
        });

        saveStatus.textContent = "✓ Settings saved!";
        saveStatus.className = "save-status";

        setTimeout(() => {
            saveStatus.textContent = "";
        }, 3000);
    } catch (error) {
        console.error("Error saving settings:", error);
        saveStatus.textContent = "✗ Error saving settings";
        saveStatus.className = "save-status error";
    } finally {
        saveButton.disabled = false;
    }
}

/**
 * Handle adding a custom layout
 */
async function handleAddCustomLayout() {
    const layout1Name = document.getElementById("customLayout1Name").value.trim();
    const layout2Name = document.getElementById("customLayout2Name").value.trim();
    const layout1Chars = document.getElementById("customLayout1Chars").value.trim();
    const layout2Chars = document.getElementById("customLayout2Chars").value.trim();

    if (!layout1Name || !layout2Name || !layout1Chars || !layout2Chars) {
        alert("Please fill in all fields");
        return;
    }

    if (layout1Chars.length !== layout2Chars.length) {
        alert("Both character mappings must have the same length");
        return;
    }

    const id = `${layout1Name}-${layout2Name}`.toLowerCase().replaceAll(/[^a-z0-9]/g, "-");

    const config = {
        name: `${layout1Name} ↔ ${layout2Name}`,
        layouts: {
            [layout1Name.toLowerCase()]: {
                chars: layout1Chars,
                name: layout1Name,
            },
            [layout2Name.toLowerCase()]: {
                chars: layout2Chars,
                name: layout2Name,
            },
        },
    };

    // Save to storage
    const settings = await chrome.storage.sync.get(["customLayouts"]);
    const customLayouts = settings.customLayouts || {};
    customLayouts[id] = config;

    await chrome.storage.sync.set({ customLayouts });

    // Add to global layouts
    addCustomLayout(id, config);

    // Add to UI
    displayCustomLayout(id, config);

    // Add a Live Test button for the new layout (no shortcut label yet).
    createTestButton(id, config, "");

    // Clear form
    document.getElementById("customLayout1Name").value = "";
    document.getElementById("customLayout2Name").value = "";
    document.getElementById("customLayout1Chars").value = "";
    document.getElementById("customLayout2Chars").value = "";
}

/**
 * Display a custom layout as a full layout row in the shortcuts container.
 */
function displayCustomLayout(id, config) {
    if (document.getElementById(`layout-row-${id}`)) return;

    const configLayouts = config?.layouts;
    if (!configLayouts) {
        console.warn("displayCustomLayout: invalid config for", id, config);
        return;
    }

    // Filter out null/undefined entries so malformed stored configs still render.
    const layoutKeys = Object.keys(configLayouts).filter((k) => configLayouts[k] != null);
    // Ensure at least two entries exist, padding with empty fallbacks if needed.
    while (layoutKeys.length < 2) layoutKeys.push(layoutKeys[0] ?? id);

    const entry0 = configLayouts[layoutKeys[0]] || { name: layoutKeys[0], chars: "" };
    const entry1 = configLayouts[layoutKeys[1]] || { name: layoutKeys[1], chars: "" };
    const layout1Name = entry0.name || layoutKeys[0];
    const layout2Name = entry1.name || layoutKeys[1];

    // ---- Outer card wrapper (provides spacing + left-accent border) ----
    const card = document.createElement("div");
    card.id = `layout-card-${id}`;
    card.className = "custom-layout-card";

    // ---- Main shortcut row ----
    const row = document.createElement("div");
    row.id = `layout-row-${id}`;
    row.className = "shortcut-item custom-layout-row";
    row.innerHTML = `
    <label class="layout-row-checkbox-label" title="Enable this layout">
      <input type="checkbox" id="layout-${id}" value="${id}">
    </label>
    <div class="layout-label-block">
      <span class="layout-name" id="shortcut-${id}-label">${layout1Name} ↔ ${layout2Name}</span>
      <span class="help-text" id="shortcut-${id}-helplabel">Auto-detects direction</span>
      <div class="layout-rename-row" style="display:none">
        <input type="text" class="layout-name-input-1" value="${layout1Name}" placeholder="Layout 1 name">
        <span class="rename-sep">↔</span>
        <input type="text" class="layout-name-input-2" value="${layout2Name}" placeholder="Layout 2 name">
      </div>
    </div>
    <button type="button" class="direction-toggle" id="shortcut-${id}-direction"
      data-direction="auto"
      data-name1="${layout1Name}" data-name2="${layout2Name}"
      title="Auto-detect direction">&#8596;</button>
    <div class="vertical-divider"></div>
    <div class="shortcut-input-group">
      <label><input type="checkbox" id="shortcut-${id}-ctrl"> Ctrl</label>
      <label><input type="checkbox" id="shortcut-${id}-shift" checked> Shift</label>
      <label><input type="checkbox" id="shortcut-${id}-alt" checked> Alt</label>
      <input type="text" id="shortcut-${id}-key" maxlength="1" value="" placeholder="Key">
    </div>
    <div class="layout-actions">
      <button class="btn btn-edit">Edit</button>
      <button class="btn btn-save-edit" style="display:none">Save</button>
      <button class="btn btn-cancel-edit" style="display:none">Cancel</button>
      <button class="btn btn-remove" data-layout-id="${id}">Remove</button>
    </div>
  `;

    // ---- Character-mapping edit panel ----
    const charsPanel = document.createElement("div");
    charsPanel.className = "chars-edit-panel";
    charsPanel.style.display = "none";
    charsPanel.innerHTML = `
    <div class="chars-edit-pair">
      <div class="chars-edit-field">
        <label class="chars-label-1">${layout1Name}</label>
        <textarea class="chars-input-1" rows="2" spellcheck="false">${entry0.chars || ""}</textarea>
      </div>
      <div class="chars-edit-sep">&#8596;</div>
      <div class="chars-edit-field">
        <label class="chars-label-2">${layout2Name}</label>
        <textarea class="chars-input-2" rows="2" spellcheck="false">${entry1.chars || ""}</textarea>
      </div>
    </div>
    <p class="chars-edit-hint">Enter characters in the same order. Both fields must have equal length.</p>
  `;

    card.appendChild(row);
    card.appendChild(charsPanel);

    // ---- Enable checkbox - toggle enabled on the card ----
    row.querySelector(`#layout-${id}`).addEventListener("change", (e) => {
        card.classList.toggle("enabled", e.target.checked);
    });

    // ---- Direction toggle ----
    const dirBtn = row.querySelector(`#shortcut-${id}-direction`);
    const strongLabel = row.querySelector(`#shortcut-${id}-label`);
    const helpLabel = row.querySelector(`#shortcut-${id}-helplabel`);
    applyDirectionUI(dirBtn, strongLabel, helpLabel, "auto");
    dirBtn.addEventListener("click", () => {
        let next;
        if (dirBtn.dataset.direction === "auto") {
            next = "forward";
        } else if (dirBtn.dataset.direction === "forward") {
            next = "reverse";
        } else {
            next = "auto";
        }
        applyDirectionUI(dirBtn, strongLabel, helpLabel, next);
    });

    // ---- Key input ----
    wireKeyInput(row.querySelector(`#shortcut-${id}-key`));

    // ---- Edit (names + chars together) ----
    const nameSpan = row.querySelector(".layout-name");
    const editRow = row.querySelector(".layout-rename-row");
    const nameInput1 = row.querySelector(".layout-name-input-1");
    const nameInput2 = row.querySelector(".layout-name-input-2");
    const editBtn = row.querySelector(".btn-edit");
    const saveEditBtn = row.querySelector(".btn-save-edit");
    const cancelEditBtn = row.querySelector(".btn-cancel-edit");
    const charsInput1 = charsPanel.querySelector(".chars-input-1");
    const charsInput2 = charsPanel.querySelector(".chars-input-2");

    const enterEditMode = () => {
        nameInput1.value = dirBtn.dataset.name1;
        nameInput2.value = dirBtn.dataset.name2;
        charsInput1.value = config.layouts[layoutKeys[0]]?.chars ?? entry0.chars ?? "";
        charsInput2.value = config.layouts[layoutKeys[1]]?.chars ?? entry1.chars ?? "";
        nameSpan.style.display = "none";
        editRow.style.display = "";
        charsPanel.style.display = "";
        editBtn.style.display = "none";
        saveEditBtn.style.display = "";
        cancelEditBtn.style.display = "";
        nameInput1.focus();
        nameInput1.select();
    };
    const exitEditMode = () => {
        nameSpan.style.display = "";
        editRow.style.display = "none";
        charsPanel.style.display = "none";
        editBtn.style.display = "";
        saveEditBtn.style.display = "none";
        cancelEditBtn.style.display = "none";
    };

    editBtn.addEventListener("click", enterEditMode);
    cancelEditBtn.addEventListener("click", exitEditMode);
    [nameInput1, nameInput2, charsInput1, charsInput2].forEach((inp) => {
        inp.addEventListener("keydown", (e) => {
            if (e.key === "Escape") cancelEditBtn.click();
        });
    });
    saveEditBtn.addEventListener("click", async () => {
        const newName1 = nameInput1.value.trim();
        const newName2 = nameInput2.value.trim();
        if (!newName1 || !newName2) return;

        const newChars1 = charsInput1.value;
        const newChars2 = charsInput2.value;
        if (newChars1.length !== newChars2.length) {
            alert(
                `Both character fields must have the same length (currently ${newChars1.length} vs ${newChars2.length}).`,
            );
            return;
        }

        const keys = Object.keys(config.layouts).filter((k) => config.layouts[k] != null);

        // Update names and chars in memory
        if (config.layouts[keys[0]]) {
            config.layouts[keys[0]].name = newName1;
            config.layouts[keys[0]].chars = newChars1;
        }
        if (config.layouts[keys[1]]) {
            config.layouts[keys[1]].name = newName2;
            config.layouts[keys[1]].chars = newChars2;
        }
        addCustomLayout(id, config);

        // Update DOM
        nameSpan.textContent = `${newName1} ↔ ${newName2}`;
        dirBtn.dataset.name1 = newName1;
        dirBtn.dataset.name2 = newName2;
        applyDirectionUI(dirBtn, strongLabel, helpLabel, dirBtn.dataset.direction);
        const cl1 = charsPanel.querySelector(".chars-label-1");
        const cl2 = charsPanel.querySelector(".chars-label-2");
        if (cl1) cl1.textContent = newName1;
        if (cl2) cl2.textContent = newName2;

        exitEditMode();
        testButtonUpdaters.get(id)?.();

        const stored = await chrome.storage.sync.get(["customLayouts"]);
        const customLayouts = stored.customLayouts || {};
        if (customLayouts[id]) {
            if (customLayouts[id].layouts[keys[0]]) {
                customLayouts[id].layouts[keys[0]].name = newName1;
                customLayouts[id].layouts[keys[0]].chars = newChars1;
            }
            if (customLayouts[id].layouts[keys[1]]) {
                customLayouts[id].layouts[keys[1]].name = newName2;
                customLayouts[id].layouts[keys[1]].chars = newChars2;
            }
            await chrome.storage.sync.set({ customLayouts });
        }
    });

    // ---- Remove ----
    row.querySelector(".btn-remove").addEventListener("click", async (e) => {
        const layoutId = e.target.dataset.layoutId;
        await removeCustomLayout(layoutId);
        card.remove();
        document.querySelector(`[data-test-layout="${layoutId}"]`)?.remove();
        testButtonUpdaters.delete(layoutId);
        // Hide the section label if no custom layouts remain
        if (!document.querySelector(".custom-layout-card")) {
            document.getElementById("custom-layouts-header")?.classList.remove("visible");
        }
    });

    // ---- Insert card before the add form ----
    const addForm = document.getElementById("addCustomLayoutForm");
    if (addForm?.parentElement) {
        addForm.parentElement.insertBefore(card, addForm);
    } else {
        document.getElementById("shortcutsContainer").appendChild(card);
    }

    // Show the "Custom Layouts" section label
    document.getElementById("custom-layouts-header")?.classList.add("visible");
}

/**
 * Create and append a Live Test button for a single layout.
 * Inserts before the auto-detect button if it already exists.
 * @param {string} layoutId
 * @param {Object} config
 * @param {string} scLabel  e.g. "Alt+Shift+H" or ""
 */
function createTestButton(layoutId, config, scLabel) {
    const container = document.getElementById("testButtons");
    const hint = document.getElementById("testHint");
    if (!container) return;

    // Skip malformed configs
    const configLayouts = config?.layouts;
    if (!configLayouts) return;
    const layoutKeys = Object.keys(configLayouts);
    if (layoutKeys.length < 2 || !configLayouts[layoutKeys[0]] || !configLayouts[layoutKeys[1]]) return;

    // Don't duplicate.
    if (container.querySelector(`[data-test-layout="${layoutId}"]`)) return;

    const dirBtn = document.getElementById(`shortcut-${layoutId}-direction`);
    const currentDirection = () => (dirBtn ? dirBtn.dataset.direction : "auto");
    const updateBtnLabel = (btn) => {
        const label = getDirectionalLabel(config, currentDirection());
        btn.textContent = scLabel ? `${label} (${scLabel})` : label;
    };

    const btn = document.createElement("button");
    btn.className = "btn btn-test";
    btn.dataset.testLayout = layoutId;
    updateBtnLabel(btn);

    testButtonUpdaters.set(layoutId, () => updateBtnLabel(btn));

    if (dirBtn) {
        dirBtn.addEventListener("click", () => {
            Promise.resolve().then(() => updateBtnLabel(btn));
        });
    }

    btn.addEventListener("click", () => {
        const ta = document.getElementById("testArea");
        const start = ta.selectionStart;
        const end = ta.selectionEnd;
        const hasSelection = start !== end;
        const direction = currentDirection();
        const dirLabel = getDirectionalLabel(config, direction);

        if (hasSelection) {
            const selected = ta.value.substring(start, end);
            const converted = convertText(selected, layoutId, direction);
            ta.value = ta.value.substring(0, start) + converted + ta.value.substring(end);
            ta.selectionStart = start;
            ta.selectionEnd = start + converted.length;
        } else {
            const converted = convertText(ta.value, layoutId, direction);
            ta.value = converted;
        }
        ta.focus();
        hint.textContent = hasSelection ? `Converted selection: ${dirLabel}.` : `Converted all text: ${dirLabel}.`;
    });

    // Insert before the auto-detect button if present, otherwise append.
    const autoBtn = document.getElementById("test-btn-auto");
    if (autoBtn) {
        autoBtn.before(btn);
    } else {
        container.appendChild(btn);
    }
}

/**
 * Populate the Live Test section with one convert button per layout pair.
 * Reads enabled layouts and current shortcuts from storage to show the
 * relevant shortcut hint on each button.
 */
/**
 * Return a directional label string for a layout config + direction.
 * e.g. "Hebrew → English", "English → Hebrew", "Hebrew ↔ English"
 */
function getDirectionalLabel(config, direction) {
    const layoutKeys = Object.keys(config.layouts);
    const entry0 = config.layouts[layoutKeys[0]];
    const entry1 = config.layouts[layoutKeys[1]];
    // Fall back to config.name if either layout entry is missing
    if (!entry0 || !entry1) return config.name || "";
    const name1 = entry0.name;
    const name2 = entry1.name;
    if (direction === "forward") return `${name1} → ${name2}`;
    if (direction === "reverse") return `${name2} → ${name1}`;
    return `${name1} ↔ ${name2}`;
}

async function populateTestSection() {
    const container = document.getElementById("testButtons");
    const hint = document.getElementById("testHint");
    if (!container) return;

    const settings = await chrome.storage.sync.get({
        enabledLayouts: [getAvailableLayouts()[0]],
        "shortcut-auto-switch": getAutoSwitchDefaultShortcut(),
    });

    container.innerHTML = "";

    const allLayouts = getAvailableLayouts();

    for (const layoutId of allLayouts) {
        const config = getLayoutConfig(layoutId);
        const shortcutKey = `shortcut-${layoutId}`;
        const stored = await chrome.storage.sync.get({ [shortcutKey]: getDefaultShortcut(layoutId) });
        const sc = stored[shortcutKey];
        const scLabel = sc ? formatShortcut(sc) : "";
        createTestButton(layoutId, config, scLabel);
    }

    // Auto-detect button
    const autoSc = settings["shortcut-auto-switch"];
    const autoLabel = formatShortcut(autoSc);
    const autoBtn = document.createElement("button");
    autoBtn.id = "test-btn-auto";
    autoBtn.className = "btn btn-test auto";
    autoBtn.textContent = `Auto-detect (${autoLabel})`;
    autoBtn.title = "Detect the current layout and switch automatically";
    autoBtn.addEventListener("click", () => {
        const ta = document.getElementById("testArea");
        const start = ta.selectionStart;
        const end = ta.selectionEnd;
        const hasSelection = start !== end;
        const source = hasSelection ? ta.value.substring(start, end) : ta.value;

        // Try each layout and use the one that detects a match
        let converted = source;
        let usedLayout = null;
        for (const layoutId of getAvailableLayouts()) {
            const config = getLayoutConfig(layoutId);
            const detected = detectLayout(source, config);
            if (detected) {
                converted = convertText(source, layoutId, "auto");
                usedLayout = getDirectionalLabel(config, "auto");
                break;
            }
        }

        if (hasSelection) {
            ta.value = ta.value.substring(0, start) + converted + ta.value.substring(end);
            ta.selectionStart = start;
            ta.selectionEnd = start + converted.length;
        } else {
            ta.value = converted;
        }
        ta.focus();
        hint.textContent = usedLayout
            ? `Auto-detected and converted using ${usedLayout}.`
            : "Could not detect layout. No changes made.";
    });
    container.appendChild(autoBtn);
}

/**
 * Remove a custom layout
 */
async function removeCustomLayout(id) {
    const settings = await chrome.storage.sync.get(["customLayouts"]);
    const customLayouts = settings.customLayouts || {};

    delete customLayouts[id];

    await chrome.storage.sync.set({ customLayouts });
}
