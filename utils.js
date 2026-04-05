// Utility functions for keyboard layout switching

/**
 * Validate if a string contains characters from a specific layout
 * @param {string} text - Text to validate
 * @param {string} layoutChars - Characters in the layout
 * @returns {boolean} True if text contains layout characters
 */
function containsLayoutChars(text, layoutChars) {
    for (let char of text) {
        if (layoutChars.includes(char.toLowerCase())) {
            return true;
        }
    }
    return false;
}

/**
 * Calculate the percentage of text that matches a layout
 * @param {string} text - Text to analyze
 * @param {string} layoutChars - Characters in the layout
 * @returns {number} Percentage (0-100)
 */
function getLayoutMatchPercentage(text, layoutChars) {
    if (!text) return 0;

    let matches = 0;
    let totalChars = 0;

    for (let char of text) {
        // Skip spaces and punctuation
        if (/\s/.test(char)) continue;

        totalChars++;
        if (layoutChars.includes(char.toLowerCase())) {
            matches++;
        }
    }

    return totalChars > 0 ? (matches / totalChars) * 100 : 0;
}

/**
 * Escape special regex characters in a string
 * @param {string} string - String to escape
 * @returns {string} Escaped string
 */
function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Deep clone an object
 * @param {*} obj - Object to clone
 * @returns {*} Cloned object
 */
function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

/**
 * Debounce a function
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Format a keyboard shortcut for display
 * @param {Object} shortcut - Shortcut object with ctrl, shift, alt, key
 * @returns {string} Formatted shortcut string
 */
function formatShortcut(shortcut) {
    const parts = [];
    if (shortcut.ctrl) parts.push("Ctrl");
    if (shortcut.shift) parts.push("Shift");
    if (shortcut.alt) parts.push("Alt");
    if (shortcut.key) parts.push(shortcut.key.toUpperCase());
    return parts.join("+");
}

/**
 * Check if two shortcuts are equal
 * @param {Object} shortcut1 - First shortcut
 * @param {Object} shortcut2 - Second shortcut
 * @returns {boolean} True if shortcuts are equal
 */
function areShortcutsEqual(shortcut1, shortcut2) {
    return (
        shortcut1.ctrl === shortcut2.ctrl &&
        shortcut1.shift === shortcut2.shift &&
        shortcut1.alt === shortcut2.alt &&
        shortcut1.key.toLowerCase() === shortcut2.key.toLowerCase()
    );
}

/**
 * Validate a keyboard shortcut object
 * @param {Object} shortcut - Shortcut to validate
 * @returns {boolean} True if valid
 */
function isValidShortcut(shortcut) {
    return (
        shortcut &&
        typeof shortcut.ctrl === "boolean" &&
        typeof shortcut.shift === "boolean" &&
        typeof shortcut.key === "string" &&
        shortcut.key.length > 0
    );
}
