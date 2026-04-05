# ⌨️ Keyboard Layout Switcher

A Chrome extension that allows you to convert text between different keyboard layouts using customizable keyboard shortcuts. Perfect for when you accidentally type in the wrong keyboard layout!

## ✨ Features

- 🔄 **Quick Layout Switching**: Highlight text and press a keyboard shortcut to convert between layouts
- 🌍 **Multi-Language Support**: Built-in support for Hebrew ↔ English and Russian ↔ English
- 🤖 **Auto-Detection**: Intelligent algorithm to automatically detect and switch to the correct layout
- ⚙️ **Customizable Shortcuts**: Configure your own keyboard shortcuts for each layout pair
- 🎨 **Custom Layouts**: Add your own keyboard layout mappings
- 🚀 **Works Everywhere**: Functions on all websites, including input fields, text areas, and contenteditable elements

## 🎯 Supported Layouts

### Built-in Layouts

- **Hebrew ↔ English**: Full QWERTY mapping
- **Russian ↔ English**: Full QWERTY mapping

### Custom Layouts

Easily add your own keyboard layouts through the settings page!

## 📦 Installation

### From Source

1. Clone this repository:

    ```bash
    git clone https://github.com/DenverCoder1/keyboard-switch-shortcut.git
    cd keyboard-switch-shortcut
    ```

2. Open Chrome and navigate to `chrome://extensions/`

3. Enable "Developer mode" (toggle in top-right corner)

4. Click "Load unpacked" and select the extension directory

5. The extension icon should appear in your browser toolbar

### From Chrome Web Store

_Coming soon!_

## 🚀 Usage

### Basic Usage

1. **Select text** that you want to convert (e.g., text typed in the wrong keyboard layout)
2. **Press the keyboard shortcut** for the desired layout conversion
3. The selected text will be instantly converted!

### Default Keyboard Shortcuts

- **Hebrew ↔ English**: `Alt + Shift + H`
- **Russian ↔ English**: `Alt + Shift + R`
- **Auto-detect and Switch**: `Alt + Shift + A`

### Configuring Settings

1. Right-click the extension icon and select "Options" (or go to `chrome://extensions/` and click "Details" → "Extension options")
2. In the settings page, you can:
    - Enable/disable specific layout pairs
    - Customize keyboard shortcuts
    - Add custom keyboard layouts
    - View layout mappings

### Adding Custom Layouts

1. Open the extension settings page
2. Scroll to the "Custom Layouts" section
3. Fill in the following fields:
    - **Layout Pair Name**: A descriptive name (e.g., "French-English")
    - **Layout 1 Name**: Name of the first layout (e.g., "French")
    - **Layout 2 Name**: Name of the second layout (e.g., "English")
    - **Layout 1 Characters**: Character mapping in QWERTY order
    - **Layout 2 Characters**: Character mapping in QWERTY order
4. Click "Add Custom Layout"
5. Save your settings

#### Character Mapping Format

Enter characters in the order they appear on a QWERTY keyboard:

```
qwertyuiop[]asdfghjkl;'zxcvbnm,./
```

For example, Hebrew characters map as:

```
/'קראטוןםפשדגכעיחלךף,זסבהנמצתץ.
```

## 🛠️ Technical Details

### Project Structure

```
keyboard-switch-shortcut/
├── manifest.json          # Extension manifest
├── content.js            # Content script for text conversion
├── layouts.js            # Keyboard layout definitions
├── utils.js              # Utility functions
├── settings/
│   ├── settings.html     # Settings page
│   ├── settings.css      # Settings page styles
│   └── settings.js       # Settings page logic
└── icons/
    ├── icon16.png        # 16x16 icon
    ├── icon48.png        # 48x48 icon
    └── icon128.png       # 128x128 icon
```

### How It Works

1. The content script runs on all web pages and listens for configured keyboard shortcuts
2. When a shortcut is pressed, it captures the selected text
3. The text is converted using character mapping between layouts
4. The original text is replaced with the converted text
5. Settings are stored in Chrome's sync storage for cross-device synchronization

### 🗺️ Roadmap

- [ ] Publish to Chrome Web Store
- [ ] Add support for more languages
- [ ] Context menu integration
- [ ] Popup interface for quick settings
- [ ] Export/import custom layouts
- [ ] Browser-specific keyboard shortcuts
- [ ] Statistics and usage tracking (opt-in)
