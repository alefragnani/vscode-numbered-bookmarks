# Copilot Instructions for Numbered Bookmarks

Always reference these instructions first and fall back to additional search or terminal commands only when project files do not provide enough context.

## Project Overview

Numbered Bookmarks is a Visual Studio Code extension that helps users navigate code by marking and jumping to important positions with numbered bookmarks (0-9), inspired by Delphi IDE.

## Technology Stack

- Language: TypeScript
- Runtime: VS Code Extension API (Node.js)
- Bundler: Webpack 5
- Linting: ESLint (`eslint-config-vscode-ext`)
- Testing: Mocha + `@vscode/test-electron`

## Working Effectively

Bootstrap and local setup:

```bash
git submodule init
git submodule update
npm install
```

Build and development quickstart:

```bash
npm run build
npm run lint
```

- Use `npm run watch` during active development.
- Use VS Code "Launch Extension" (F5) to validate behavior in Extension Development Host.
- Expected command timings are usually under 10 seconds.
- Never cancel `npm install`, `npm run watch`, or `npm test` once started.
## Build and Development Commands

- `npm run compile` - TypeScript compilation
- `npm run build` - Webpack development build
- `npm run watch` - Continuous webpack build
- `npm run lint` - ESLint validation
- `npm run test` - Full test suite
- `npm run vscode:prepublish` - Production build

## Testing and Validation

Automated tests use the VS Code test runner and may fail in restricted environments due to VS Code download/network constraints.

Manual validation checklist:

1. Run `npm run build` successfully.
2. Press F5 to launch Extension Development Host.
3. Toggle bookmarks (`0`-`9`) and validate gutter/line decoration updates.
4. Jump to existing and undefined bookmarks and verify behavior.
5. Validate persistence behavior across file reload and VS Code restart.

If `npm test` fails with connectivity errors to VS Code download endpoints, treat this as environment-related unless code-level failures are present.

## Project Structure and Key Files

```
src/
├── core/                 # Core bookmark logic (Controller, File, Bookmark, operations)
├── decoration/           # Gutter and line decorations
├── sticky/               # Sticky bookmark engine (legacy and new)
├── storage/              # Workspace state persistence
├── quickpick/            # Quick pick UI components
├── utils/                # Utility functions (fs, reveal, revealLocation)
├── whats-new/            # What's New feature
└── extension.ts          # Main extension entry point

dist/                     # Webpack build output
l10n/                     # Localization files
out/                      # Compiled TypeScript files
vscode-whats-new/         # Git submodule for What's New
walkthrough/              # Getting Started walkthrough content
```

## Coding Conventions and Patterns

### Indentation

- We spaces, not tabs.
- Use 4 spaces for indentation.

### Naming Conventions

- Use PascalCase for `type` names
- Use PascalCase for `enum` values
- Use camelCase for `function` and `method` names
- Use camelCase for `property` names and `local variables`
- Use whole words in names when possible

### Types

- Do not export `types` or `functions` unless you need to share it across multiple components
- Do not introduce new `types` or `values` to the global namespace
- Prefer `const` over `let` when possible.

### Strings

- Use "double quotes"
- All strings visible to the user need to be externalized using the `l10n` API
- Externalized strings must not use string concatenation. Use placeholders instead (`{0}`).

### Code Quality

- All files must include copyright header
- Prefer `async` and `await` over `Promise` and `then` calls
- All user facing messages must be localized using the applicable localization framework (for example `l10n.t` method)
- Keep imports organized: VS Code first, then internal modules.
- Use semicolons at the end of statements.
- Keep changes minimal and aligned with existing style.

### Import Organization

- Import VS Code API first: `import * as vscode from "vscode"`
- Group related imports together
- Use named imports for specific VS Code types
- Import from local modules using relative paths

### Architecture Patterns
- **Container Pattern**: The `Container` class stores global state like `Container.context`
- **Controller Pattern**: `Controller` class manages files and bookmarks per workspace folder
- **File Pattern**: `File` class represents a document with its bookmarks
- **Bookmark Pattern**: `Bookmark` interface with line and column positions
- **Sticky Engine**: Two implementations (legacy and new) for maintaining bookmark positions during edits
- **Decoration Pattern**: Separate decoration types for gutter icons and line backgrounds
- **Event-Driven**: Heavy use of VS Code events (`onDidChangeConfiguration`, `onDidChangeTextDocument`, etc.)

## Extension Features and Configuration

### Key Features
1. **Bookmark management**: Commands 0-9 to mark/unmark positions
2. **Navigation**: Commands 0-9 to navigate to marked positions
3. **Selection**: select lines between bookmarks, expand/shrink selections
4. **Sidebar**: tree view showing all bookmarks organized by file
5. **Persistence**: Save bookmarks in workspace state or project files
6. **Sticky bookmarks**: Maintain bookmark positions during edits
7. **Multi-root workspace**: Manage bookmarks per workspace folder
8. **Remote Development**: Support for remote development scenarios
9. **Internationalization support**: Localization of all user-facing strings
10. **Customizable Appearance**: Gutter icons, line backgrounds, colors
11. **Walkthrough**: Getting Started guide for new users

### Important Settings
- `numberedBookmarks.saveBookmarksInProject`: Save in `.vscode/numbered-bookmarks.json`
- `numberedBookmarks.navigateThroughAllFiles`: How to navigate across files (false/replace/allowDuplicates)
- `numberedBookmarks.gutterIconFillColor`: Gutter icon background color
- `numberedBookmarks.experimental.enableNewStickyEngine`: Use new sticky engine (default: true)

## Dependencies and External Tools

### Production
- `VS Code-ext-codicons`: Codicon support
- `VS Code-ext-decoration`: Decoration utilities
- `os-browserify`, `path-browserify`: Polyfills for browser compatibility

### Development
- ESLint with `eslint-config-VS Code-ext`
- TypeScript ^4.4.4
- Webpack 5 with ts-loader and terser plugin

## Troubleshooting and Known Limitations

- **Bookmark #0**: Reactivated but has no keyboard shortcut due to OS limitations
- **macOS Shortcuts**: Use `Cmd` instead of `Ctrl` for some shortcuts (Cmd+Shift+3, Cmd+Shift+4)
- **Untitled Files**: Special handling for untitled documents
- **Path Handling**: Cross-platform path handling (Windows backslashes vs. Unix forward slashes)
- **Localization**: Support for multiple languages via l10n and package.nls.*.json files
- **Walkthrough**: Extension includes a getting started walkthrough

## CI and Pre-Commit Validation

Before committing:

1. Run `npm run lint`.
2. Run `npm run build`.
3. Run `npm run pretest`.

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




