# Keyboard Layout Switcher

A Chrome extension that converts selected text between keyboard layouts using configurable shortcuts. Useful for when you accidentally type in the wrong keyboard layout.

![keyboard-locale-switcher](https://github.com/user-attachments/assets/4845d1d7-40e4-4643-ae06-bb6583c19ce8)

## Supported Layouts

- Hebrew ↔ English
- Russian ↔ English
- Custom layouts (add via settings)

## Installation

1. Clone this repository
2. Go to `chrome://extensions/` and enable Developer mode
3. Click "Load unpacked" and select the project directory

## Usage

1. Select the text you want to convert
2. Press the shortcut for the desired layout pair

### Default Shortcuts

- Hebrew ↔ English: `Alt + Shift + H`
- Russian ↔ English: `Alt + Shift + R`
- Auto-detect and switch: `Alt + Shift + A`

Shortcuts can be changed in the extension settings.

## Custom Layouts

In the settings page, add a layout by providing a name and the character strings for each side in QWERTY order:

```
qwertyuiop[]asdfghjkl;'zxcvbnm,./
```

Hebrew example:

```
/'קראטוןםפ][שדגכעיחלךף,זסבהנמצתץ.
```

## Settings UI

You can open the Settings UI by clicking on the extension icon or by visiting "Extension Options" from the extension manager or context menus.

<img width="883" height="809" alt="image" src="https://github.com/user-attachments/assets/58ff5468-5186-464e-b1f5-ffa5444f3104" />
