# Contributing to Keyboard Layout Switcher

Thank you for your interest in contributing to this project! This guide will help you get started.

## 🚀 Getting Started

### Prerequisites

- Google Chrome or Chromium-based browser
- Basic knowledge of JavaScript, HTML, and CSS
- Familiarity with Chrome Extension development (helpful but not required)

### Setting Up Development Environment

1. **Fork and Clone**

    ```bash
    git clone https://github.com/YOUR_USERNAME/keyboard-switch-shortcut.git
    cd keyboard-switch-shortcut
    ```

2. **Load Extension in Chrome**
    - Open Chrome and go to `chrome://extensions/`
    - Enable "Developer mode" (toggle in top-right)
    - Click "Load unpacked"
    - Select the project directory
    - The extension is now loaded!

3. **Making Changes**
    - Edit the code in your preferred editor
    - For most changes, you'll need to reload the extension:
        - Go to `chrome://extensions/`
        - Click the reload icon on the extension card
    - For content script changes, you may also need to reload the webpage

## 📝 Adding New Keyboard Layouts

### Quick Guide

1. Open `layouts.js`
2. Add your layout to the `KEYBOARD_LAYOUTS` object:

```javascript
'your-layout-id': {
  name: 'Language 1 ↔ Language 2',
  layouts: {
    language1: {
      chars: "character_mapping_here",
      name: 'Language 1'
    },
    language2: {
      chars: "qwertyuiop[]asdfghjkl;'zxcvbnm,./",
      name: 'Language 2'
    }
  }
}
```

### Character Mapping Format

The character mapping should follow the QWERTY keyboard layout order:

```
q w e r t y u i o p [ ]
a s d f g h j k l ; '
z x c v b n m , . /
```

**Example for Hebrew:**

```javascript
chars: "/'קראטוןםפשדגכעיחלךף,זסבהנמצתץ.";
```

### Testing Your Layout

1. Reload the extension
2. Open the extension settings page
3. Enable your new layout
4. Configure a keyboard shortcut
5. Test on a webpage:
    - Type some text in your source layout
    - Select it and press the configured shortcut
    - Verify the conversion is correct

### Layout Checklist

- [ ] Layout ID is unique and descriptive (use kebab-case)
- [ ] Layout name is clear and uses the ↔ symbol
- [ ] Both character mappings are the same length
- [ ] Character order matches QWERTY keyboard layout
- [ ] Tested with various text samples
- [ ] Both directions work correctly (A→B and B→A)

## 🐛 Reporting Bugs

When reporting bugs, please include:

1. **Description**: Clear description of the issue
2. **Steps to Reproduce**:
    - Step 1
    - Step 2
    - Step 3
3. **Expected Behavior**: What should happen
4. **Actual Behavior**: What actually happens
5. **Environment**:
    - Browser version
    - Operating System
    - Extension version
6. **Screenshots**: If applicable

## 💡 Feature Requests

We welcome feature requests! Please:

1. Check existing issues to avoid duplicates
2. Clearly describe the feature and its use case
3. Explain why this feature would be useful
4. Provide examples or mockups if possible

## 🔧 Code Style

- Use consistent indentation (2 spaces)
- Use meaningful variable and function names
- Add comments for complex logic
- Follow existing code patterns
- Use modern JavaScript (ES6+)

## 📋 Pull Request Process

1. **Create a Branch**

    ```bash
    git checkout -b feature/your-feature-name
    ```

2. **Make Your Changes**
    - Write clean, documented code
    - Test thoroughly
    - Update documentation if needed

3. **Commit Your Changes**

    ```bash
    git add .
    git commit -m "Add: brief description of changes"
    ```

    Use conventional commits:
    - `Add:` for new features
    - `Fix:` for bug fixes
    - `Update:` for updates to existing features
    - `Docs:` for documentation changes

4. **Push to Your Fork**

    ```bash
    git push origin feature/your-feature-name
    ```

5. **Create Pull Request**
    - Go to the original repository
    - Click "New Pull Request"
    - Select your branch
    - Fill in the PR template
    - Submit!

## 🎯 Priority Areas

We especially welcome contributions in these areas:

- **New keyboard layouts**: Popular language pairs
- **Bug fixes**: Any reproducible bugs
- **Documentation**: Improvements to guides and examples
- **UI/UX improvements**: Better settings page design
- **Performance optimizations**: Faster text conversion
- **Accessibility**: Making the extension more accessible

## ❓ Questions?

If you have questions about contributing:

- Check the [README](README.md) for general information
- Look through existing [issues](https://github.com/DenverCoder1/keyboard-switch-shortcut/issues)
- Open a new issue with the "question" label

## 📜 Code of Conduct

- Be respectful and inclusive
- Welcome newcomers
- Focus on constructive feedback
- Help others learn and grow

## 🙏 Thank You!

Your contributions make this project better for everyone. Thank you for taking the time to contribute!
