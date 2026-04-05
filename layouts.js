// Keyboard layout mappings
const KEYBOARD_LAYOUTS = {
    "hebrew-english": {
        defaultShortcut: { ctrl: false, shift: true, alt: true, key: "H", direction: "auto" },
        layouts: {
            hebrew: {
                chars: "/'קראטוןםפ][שדגכעיחלךף,זסבהנמצתץ.",
                name: "Hebrew",
            },
            english: {
                chars: "qwertyuiop[]asdfghjkl;'zxcvbnm,./",
                name: "English",
            },
        },
    },
    "russian-english": {
        defaultShortcut: { ctrl: false, shift: true, alt: true, key: "R", direction: "auto" },
        layouts: {
            russian: {
                chars: "йцукенгшщзхъфывапролджэячсмитьбю.",
                name: "Russian",
            },
            english: {
                chars: "qwertyuiop[]asdfghjkl;'zxcvbnm,./",
                name: "English",
            },
        },
    },
    "arabic-english": {
        defaultShortcut: { ctrl: false, shift: true, alt: true, key: "E", direction: "auto" },
        layouts: {
            arabic: {
                chars: "ضصثقفغعهخحجدشسيبلاتنمكطئءؤرلىةوزظ",
                name: "Arabic",
            },
            english: {
                chars: "qwertyuiop[]asdfghjkl;'zxcvbnm,./",
                name: "English",
            },
        },
    },
};

/** Default shortcut for the auto-detect & switch action */
const AUTO_SWITCH_DEFAULT_SHORTCUT = { ctrl: false, shift: true, alt: true, key: "A", direction: "auto" };

/**
 * Create a character mapping between two layouts
 * @param {string} from - Source layout characters
 * @param {string} to - Target layout characters
 * @returns {Object} Character mapping object
 */
function createCharMapping(from, to) {
    if (from.length !== to.length) {
        console.warn(
            `[KLS] createCharMapping(): length mismatch: from.length=${from.length}, to.length=${to.length}. ` +
                `Only the first ${Math.min(from.length, to.length)} characters will be mapped.`,
        );
    }
    const mapping = {};
    const length = Math.min(from.length, to.length);

    for (let i = 0; i < length; i++) {
        const fromChar = from[i];
        const toChar = to[i];

        // Always map the base character → its target (prefer lowercase output for caseless scripts)
        mapping[fromChar] = toChar;

        // Only add an uppercase entry when the source character actually has a distinct
        // uppercase form (e.g. Latin 'n' → 'N'). Caseless scripts like Hebrew/Cyrillic
        // have toUpperCase() === self, so skipping this prevents the uppercase overwrite
        // that would otherwise turn מ → 'N' instead of the correct 'n'.
        if (fromChar !== fromChar.toUpperCase()) {
            mapping[fromChar.toUpperCase()] = toChar.toUpperCase();
        }
    }

    return mapping;
}

/**
 * Get the default shortcut for the auto-detect & switch action
 * @returns {Object}
 */
function getAutoSwitchDefaultShortcut() {
    return AUTO_SWITCH_DEFAULT_SHORTCUT;
}

/**
 * Get the default shortcut configuration for a built-in layout
 * @param {string} layoutId - Layout identifier
 * @returns {Object|null} Default shortcut config, or null if not a built-in layout
 */
function getDefaultShortcut(layoutId) {
    return KEYBOARD_LAYOUTS[layoutId]?.defaultShortcut ?? null;
}

/**
 * Get all available layout pairs
 * @returns {Array} Array of layout pair identifiers
 */
function getAvailableLayouts() {
    return Object.keys(KEYBOARD_LAYOUTS);
}

/**
 * Get layout configuration by identifier
 * @param {string} layoutId - Layout identifier
 * @returns {Object} Layout configuration
 */
function getLayoutConfig(layoutId) {
    return KEYBOARD_LAYOUTS[layoutId];
}

/**
 * Add a custom layout to the available layouts
 * @param {string} id - Unique identifier for the layout
 * @param {Object} config - Layout configuration
 */
function addCustomLayout(id, config) {
    KEYBOARD_LAYOUTS[id] = config;
}
