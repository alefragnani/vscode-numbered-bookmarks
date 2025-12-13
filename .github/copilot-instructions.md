# Copilot Instructions for Numbered Bookmarks

## Project Overview

Numbered Bookmarks is a Visual Studio Code extension that helps users navigate code by marking and jumping to important positions with numbered bookmarks (0-9), inspired by Delphi IDE.

## Technology Stack

- **Language**: TypeScript
- **Target Platform**: VS Code Extension (Node.js)
- **Build Tool**: Webpack 5
- **Testing Framework**: Mocha with @vscode/test-electron
- **Minimum VS Code Version**: 1.73.0
- **License**: GPL-3.0

## Project Structure

```
src/
├── core/           # Core bookmark logic (Controller, File, Bookmark, operations)
├── decoration/     # Gutter and line decorations
├── sticky/         # Sticky bookmark engine (legacy and new)
├── storage/        # Workspace state persistence
├── quickpick/      # Quick pick UI components
├── utils/          # Utility functions (fs, reveal, revealLocation)
├── whats-new/      # What's New feature
└── extension.ts    # Main extension entry point
```

## Build and Test Commands

### Build
- `npm run build` - Build for development with webpack
- `npm run watch` - Watch mode for development
- `npm run compile` - TypeScript compilation only
- `npm run webpack` - Webpack build (development mode)
- `npm run vscode:prepublish` - Production build (runs before publishing)

### Test
- `npm test` - Run full test suite (compile, lint, and test)
- `npm run just-test` - Run tests only (no compile or lint)
- `npm run pretest` - Compile and lint before testing
- `npm run lint` - Run ESLint on TypeScript files

### Development
- `npm run webpack-dev` - Watch mode with webpack

## Code Style and Conventions

### General
- Use 4 spaces for indentation (not tabs)
- Use double quotes for strings
- Include copyright header in all source files:
  ```typescript
  /*---------------------------------------------------------------------------------------------
  *  Copyright (c) Alessandro Fragnani. All rights reserved.
  *  Licensed under the GPLv3 License. See License.md in the project root for license information.
  *--------------------------------------------------------------------------------------------*/
  ```

### TypeScript
- Target: ES2020
- Use strict mode (`alwaysStrict: true`)
- Prefer explicit types over `any`
- Use modern ES6+ features (arrow functions, const/let, template literals)
- Import from 'vscode' module for VS Code API
- Use named imports where possible

### Naming Conventions
- Classes: PascalCase (e.g., `Controller`, `BookmarkQuickPickItem`)
- Functions/Methods: camelCase (e.g., `loadBookmarks`, `isBookmarkDefined`)
- Constants: UPPER_SNAKE_CASE (e.g., `NO_BOOKMARK_DEFINED`, `UNTITLED_SCHEME`)
- Private class members: camelCase without underscore prefix

### Architecture Patterns
- **Controller Pattern**: `Controller` class manages files and bookmarks per workspace folder
- **File Pattern**: `File` class represents a document with its bookmarks
- **Bookmark Pattern**: `Bookmark` interface with line and column positions
- **Sticky Engine**: Two implementations (legacy and new) for maintaining bookmark positions during edits
- **Decoration Pattern**: Separate decoration types for gutter icons and line backgrounds

## Extension Features to Maintain

1. **Toggle Bookmarks**: Commands 0-9 to mark/unmark positions
2. **Jump to Bookmarks**: Commands 0-9 to navigate to marked positions
3. **List Commands**: Show bookmarks from current file or all files
4. **Clear Commands**: Remove bookmarks from current file or all files
5. **Multi-root Workspace Support**: Manage bookmarks per workspace folder
6. **Remote Development Support**: Works with Docker, SSH, WSL
7. **Sticky Bookmarks**: Maintain positions during code edits
8. **Customizable Appearance**: Gutter icons, line backgrounds, colors
9. **Persistence**: Save bookmarks in workspace state or project files

## Configuration Settings

Key settings in `package.json`:
- `saveBookmarksInProject`: Save in `.vscode/numbered-bookmarks.json`
- `experimental.enableNewStickyEngine`: Use new sticky engine (default: true)
- `keepBookmarksOnLineDelete`: Move bookmarks to next line on delete
- `showBookmarkNotDefinedWarning`: Show warning when bookmark not defined
- `navigateThroughAllFiles`: How to navigate across files (false/replace/allowDuplicates)
- `gutterIconFillColor`: Gutter icon background color
- `gutterIconNumberColor`: Gutter icon number color
- `revealLocation`: Where to reveal bookmarked line (top/center)

## Testing Guidelines

- Use Mocha test framework with `suite` and `test` functions
- Import VS Code API for extension testing
- Test extension activation and core functionality
- Use async/await for asynchronous operations
- Include timeout utilities for async tests

## Important Notes

- **Bookmark #0**: Reactivated but has no keyboard shortcut due to OS limitations
- **macOS Shortcuts**: Use `Cmd` instead of `Ctrl` for some shortcuts (Cmd+Shift+3, Cmd+Shift+4)
- **Untitled Files**: Special handling for untitled documents
- **Path Handling**: Cross-platform path handling (Windows backslashes vs. Unix forward slashes)
- **Localization**: Support for multiple languages via l10n and package.nls.*.json files
- **Walkthrough**: Extension includes a getting started walkthrough

## Dependencies

### Production
- `vscode-ext-codicons`: Codicon support
- `vscode-ext-decoration`: Decoration utilities
- `os-browserify`, `path-browserify`: Polyfills for browser compatibility

### Development
- ESLint with `eslint-config-vscode-ext`
- TypeScript ^4.4.4
- Webpack 5 with ts-loader and terser plugin

## Common Tasks

### Adding a New Command
1. Add command definition in `package.json` > `contributes.commands`
2. Add localized string in `package.nls.json`
3. Register command handler in `src/extension.ts`
4. Add keyboard binding if needed in `package.json` > `contributes.keybindings`
5. Update menu contributions if applicable

### Modifying Bookmark Behavior
- Core logic in `src/core/operations.ts`
- Sticky behavior in `src/sticky/sticky.ts` or `src/sticky/stickyLegacy.ts`
- Visual updates in `src/decoration/decoration.ts`

### Adding Tests
- Create test files in `src/test/suite/`
- Follow existing test patterns with Mocha
- Update test suite index if needed

## External Resources

- Extension published to VS Code Marketplace and Open VSX
- Documentation in README.md
- Changelog in CHANGELOG.md
- Submodule: vscode-whats-new for What's New feature
