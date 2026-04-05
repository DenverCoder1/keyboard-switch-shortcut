// Debug flag to enable/disable console logging for development
const DEBUG = false;

// Content script for keyboard layout switching
let lastSelectedText = "";
let lastSelectedRange = null;

/** Log only when DEBUG is true */
function dbg(...args) {
    if (DEBUG) console.log("[KLS]", ...args);
}

/**
 * Get the currently selected text and its range.
 * Handles both globalThis.getSelection() (regular DOM) and the separate selection
 * model used by <input> and <textarea> elements.
 * @returns {{text: string, range: Range|null, selection: Selection|null}|null}
 */
function getSelectionInfo() {
    const activeElement = document.activeElement;
    dbg("getSelectionInfo(): activeElement:", activeElement?.tagName ?? "none");

    // <input> and <textarea> use their own selection model; globalThis.getSelection()
    // always returns an empty string for text selected inside these elements.
    if (activeElement && (activeElement.tagName === "INPUT" || activeElement.tagName === "TEXTAREA")) {
        const start = activeElement.selectionStart;
        const end = activeElement.selectionEnd;
        const text = activeElement.value.substring(start, end);
        if (!text) {
            // No selection - fall back to the entire field value
            const fullText = activeElement.value;
            if (!fullText) {
                dbg("getSelectionInfo(): no text and field is empty in", activeElement.tagName);
                return null;
            }
            // Expand the selection to the whole field so replaceSelectedText replaces it all
            activeElement.selectionStart = 0;
            activeElement.selectionEnd = fullText.length;
            dbg(`getSelectionInfo(): no selection, using full ${activeElement.tagName} value: "${fullText}"`);
            return { text: fullText, range: null, selection: null };
        }
        dbg(`getSelectionInfo(): ${activeElement.tagName} selection [${start}..${end}]: "${text}"`);
        return { text, range: null, selection: null };
    }

    const selection = globalThis.getSelection();
    if (!selection || selection.rangeCount === 0) {
        dbg("getSelectionInfo(): no DOM selection");
        return null;
    }

    const text = selection.toString();
    if (!text) {
        dbg("getSelectionInfo(): DOM selection is empty");
        return null;
    }
    const range = selection.getRangeAt(0);
    dbg(`getSelectionInfo(): DOM selection: "${text}"`);

    return { text, range, selection };
}

/**
 * Replace selected text with converted text
 * @param {Range} range - Selection range
 * @param {string} newText - New text to insert
 */
function replaceSelectedText(range, newText) {
    dbg(`replaceSelectedText(): inserting: "${newText}"`);
    try {
        // Handle input and textarea elements
        const activeElement = document.activeElement;
        if (activeElement && (activeElement.tagName === "INPUT" || activeElement.tagName === "TEXTAREA")) {
            const start = activeElement.selectionStart;
            const end = activeElement.selectionEnd;
            const value = activeElement.value;
            dbg(`replaceSelectedText(): replacing [${start}..${end}] in ${activeElement.tagName}`);

            activeElement.value = value.substring(0, start) + newText + value.substring(end);
            activeElement.selectionStart = activeElement.selectionEnd = start + newText.length;

            // Trigger input event for frameworks that listen to it
            activeElement.dispatchEvent(new Event("input", { bubbles: true }));
            dbg("replaceSelectedText(): input event dispatched");
        } else if (range) {
            // Handle contenteditable and regular text
            dbg("replaceSelectedText(): replacing via DOM Range");
            range.deleteContents();
            const textNode = document.createTextNode(newText);
            range.insertNode(textNode);

            // Move cursor to end of inserted text
            range.setStartAfter(textNode);
            range.setEndAfter(textNode);
            globalThis.getSelection().removeAllRanges();
            globalThis.getSelection().addRange(range);
            dbg("replaceSelectedText(): DOM replacement complete");
        } else {
            dbg("replaceSelectedText(): no range and not an input/textarea, nothing replaced");
        }
    } catch (e) {
        console.error("Error replacing text:", e);
    }
}

/**
 * Convert text from one layout to another
 * @param {string} text - Text to convert
 * @param {string} layoutId - Layout identifier
 * @param {boolean} autoDetect - Whether to auto-detect direction
 * @returns {string} Converted text
 */
/**
 * @param {"auto"|"forward"|"reverse"} direction
 *   auto    – detect which layout the text is in and convert to the other
 *   forward – always convert first layout → second layout
 *   reverse – always convert second layout → first layout
 */
function convertText(text, layoutId, direction = "auto") {
    dbg(`convertText(): input: "${text}", layoutId: "${layoutId}", direction: "${direction}"`);

    const layoutConfig = getLayoutConfig(layoutId);
    if (!layoutConfig) {
        console.error("Layout not found:", layoutId);
        return text;
    }
    dbg("convertText(): layout config found:", layoutConfig);

    const layoutKeys = Object.keys(layoutConfig.layouts);
    let fromLayout, toLayout;

    if (direction === "auto") {
        // Auto-detect which layout the text is in
        const detectedLayout = detectLayout(text, layoutConfig);
        if (detectedLayout) {
            fromLayout = detectedLayout;
            toLayout = layoutKeys.find((key) => key !== detectedLayout);
            dbg(`convertText(): auto-detected: "${fromLayout}" → "${toLayout}"`);
        } else {
            // Default to first -> second if can't detect
            [fromLayout, toLayout] = layoutKeys;
            dbg(`convertText(): auto-detect failed, defaulting: "${fromLayout}" → "${toLayout}"`);
        }
    } else if (direction === "reverse") {
        // Second layout -> first layout
        [toLayout, fromLayout] = layoutKeys;
        dbg(`convertText(): reverse: "${fromLayout}" → "${toLayout}"`);
    } else {
        // "forward": first layout -> second layout
        [fromLayout, toLayout] = layoutKeys;
        dbg(`convertText(): forward: "${fromLayout}" → "${toLayout}"`);
    }

    const mapping = createCharMapping(layoutConfig.layouts[fromLayout].chars, layoutConfig.layouts[toLayout].chars);
    dbg("convertText(): char mapping built, keys:", Object.keys(mapping).length);

    const result = text
        .split("")
        .map((char) => {
            const mappedChar = mapping[char];
            if (mappedChar) {
                dbg(`  char map: "${char}" → "${mappedChar}" (direct)`);
                return mappedChar;
            } else if (mapping[char.toLowerCase()]) {
                // Preserve case if possible
                const mapped = mapping[char.toLowerCase()];
                const out = char === char.toUpperCase() ? mapped.toUpperCase() : mapped;
                dbg(`  char map: "${char}" → "${out}" (case-folded)`);
                return out;
            } else {
                dbg(`  char map: "${char}" → (no mapping, kept as-is)`);
                return char;
            }
        })
        .join("");

    dbg(`convertText(): result: "${result}"`);
    return result;
}

/**
 * Detect which layout the text is primarily using
 * @param {string} text - Text to analyze
 * @param {Object} layoutConfig - Layout configuration
 * @returns {string|null} Detected layout key or null
 */
function detectLayout(text, layoutConfig) {
    dbg(`detectLayout(): analyzing: "${text}"`);
    const layoutKeys = Object.keys(layoutConfig.layouts);
    const scores = {};

    layoutKeys.forEach((key) => {
        scores[key] = 0;
        const chars = layoutConfig.layouts[key].chars;

        for (let char of text) {
            if (chars.includes(char)) {
                scores[key] += 2; // Exact case match counts more
            } else if (chars.includes(char.toLowerCase())) {
                scores[key]++; // Case-insensitive match counts less
            }
        }
    });

    dbg("detectLayout(): scores:", JSON.stringify(scores));

    // Return layout with highest score
    const detectedLayout = Object.keys(scores).reduce((a, b) => (scores[a] > scores[b] ? a : b), null);
    const result = scores[detectedLayout] > 0 ? detectedLayout : null;
    dbg(`detectLayout(): detected: ${result ?? "none (tie or all zero)"}`);

    return result;
}

/**
 * Handle keyboard shortcut for layout switching
 * @param {string} layoutId - Layout identifier
 * @param {"auto"|"forward"|"reverse"} direction
 */
function handleLayoutSwitch(layoutId, direction = "auto") {
    dbg(`handleLayoutSwitch(): layoutId: "${layoutId}", direction: "${direction}"`);
    const selectionInfo = getSelectionInfo();

    const textSelected = selectionInfo?.text;
    if (!textSelected) {
        console.log("No text selected");
        return;
    }
    dbg(`handleLayoutSwitch(): selected text: "${textSelected}"`);

    const convertedText = convertText(textSelected, layoutId, direction);
    dbg(`handleLayoutSwitch(): converted: "${textSelected}" → "${convertedText}"`);
    replaceSelectedText(selectionInfo.range, convertedText);
}

/**
 * Check whether a KeyboardEvent matches a stored shortcut config.
 * Uses e.code for digit/letter keys so that modifier combinations like
 * Alt+Shift+H (which sets e.key="!") still match a stored key of "H".
 * @param {KeyboardEvent} e
 * @param {{ctrl: boolean, shift: boolean, alt: boolean, key: string}} shortcut
 * @returns {boolean}
 */
function matchesShortcut(e, shortcut) {
    if (e.ctrlKey !== !!shortcut.ctrl) return false;
    if (e.shiftKey !== !!shortcut.shift) return false;
    if (e.altKey !== !!shortcut.alt) return false;

    const key = shortcut.key;
    if (/^\d$/.test(key)) {
        return e.code === `Digit${key}`;
    }
    if (/^[a-zA-Z]$/.test(key)) {
        return e.code === `Key${key.toUpperCase()}`;
    }
    // Fallback for other single characters (punctuation, etc.)
    return e.key === key;
}

// Listen for keyboard shortcuts
async function onKeyDown(e) {
    // Only act when at least one modifier is held to avoid interfering with normal typing
    if (!e.ctrlKey && !e.altKey) return;
    dbg(`onKeyDown(): key: "${e.key}" code: "${e.code}" ctrl:${e.ctrlKey} shift:${e.shiftKey} alt:${e.altKey}`);

    let settings;
    try {
        // Get all settings from storage so custom layout shortcuts are included
        const stored = await chrome.storage.sync.get(null);

        // Build default shortcut entries from the layout definitions so adding a new
        // built-in layout only requires updating layouts.js.
        const shortcutDefaults = {};
        for (const layoutId of getAvailableLayouts()) {
            shortcutDefaults[`shortcut-${layoutId}`] = getDefaultShortcut(layoutId);
        }

        settings = {
            ...shortcutDefaults,
            "shortcut-auto-switch": getAutoSwitchDefaultShortcut(),
            enabledLayouts: getAvailableLayouts(),
            autoEnabled: true,
            customLayouts: {},
            ...stored,
        };
    } catch (err) {
        // Extension was reloaded/updated while this tab was open, the content script
        // is now orphaned. Remove the listener so it stops throwing on every keypress.
        document.removeEventListener("keydown", onKeyDown);
        return;
    }

    // Register any custom layouts so they are available for conversion
    for (const [layoutId, config] of Object.entries(settings.customLayouts)) {
        addCustomLayout(layoutId, config);
    }

    // Check all enabled layout shortcuts (built-in and custom) in a single loop
    for (const layoutId of settings.enabledLayouts) {
        const sc = settings[`shortcut-${layoutId}`];
        if (sc && matchesShortcut(e, sc)) {
            dbg(`onKeyDown(): matched layout shortcut: "${layoutId}", direction:`, sc.direction || "auto");
            e.preventDefault();
            handleLayoutSwitch(layoutId, sc.direction || "auto");
            return;
        }
    }

    // Check auto-switch shortcut
    if (settings.autoEnabled !== false && matchesShortcut(e, settings["shortcut-auto-switch"])) {
        dbg("onKeyDown(): matched auto-switch shortcut");
        e.preventDefault();
        // Try to auto-detect layout from enabled layouts
        const firstEnabled = settings.enabledLayouts[0];
        if (firstEnabled) {
            dbg("onKeyDown(): auto-switch using first enabled layout:", firstEnabled);
            handleLayoutSwitch(firstEnabled, "auto");
        }
    }
}

document.addEventListener("keydown", onKeyDown);

console.log("Keyboard Layout Switcher extension loaded");
