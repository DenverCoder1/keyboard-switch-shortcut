// Keyboard layout mappings
const KEYBOARD_LAYOUTS = {
    "hebrew-english": {
        name: "Hebrew ↔ English",
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
        name: "Russian ↔ English",
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
};

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
