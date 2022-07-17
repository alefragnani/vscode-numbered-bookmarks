## [8.3.1] - 2022-07-17
### Internal
- Add GitHub Sponsors support (PR [#142](https://github.com/alefragnani/vscode-numbered-bookmarks/pull/142))

## [8.3.0] - 2022-05-07
### Added
- New setting to decide if should delete bookmark if associated line is deleted (issue [#27](https://github.com/alefragnani/vscode-numbered-bookmarks/issues/27))
- Update bookmark reference on file renames (issue [#120](https://github.com/alefragnani/vscode-numbered-bookmarks/issues/120))

### Changed
- Replace custom icons with _on the fly_ approach (issue [#129](https://github.com/alefragnani/vscode-numbered-bookmarks/issues/129))

## [8.2.0] - 2022-01-12
### Added
- New **Sticky Engine** with improved support to Formatters, Multi-cursor and Undo operations (issue [#115](https://github.com/alefragnani/vscode-numbered-bookmarks/issues/115))

### Changed
- Removed deprecated setting `backgroundLineColor` (issue [#116](https://github.com/alefragnani/vscode-numbered-bookmarks/issues/116))

### Fixed
- Bookmarks removes on Undo (issue [#47](https://github.com/alefragnani/vscode-numbered-bookmarks/issues/47))

## [8.1.0] - 2021-06-09
### Added
- Support **Virtual Workspaces** (issue [#107](https://github.com/alefragnani/vscode-numbered-bookmarks/issues/107))
- Support **Workspace Trust** (issue [#108](https://github.com/alefragnani/vscode-numbered-bookmarks/issues/108))
- Support Translation (issue [#112](https://github.com/alefragnani/vscode-numbered-bookmarks/issues/112))
- Return to line/column when cancel List or List from All Files (issue [#96](https://github.com/alefragnani/vscode-numbered-bookmarks/issues/96))

### Internal
- Security Alert: lodash (dependabot [PR #109](https://github.com/alefragnani/vscode-numbered-bookmarks/pull/109))
- Security Alert: ssri (dependabot [PR #106](https://github.com/alefragnani/vscode-numbered-bookmarks/pull/106))
- Security Alert: y18n (dependabot [PR #104](https://github.com/alefragnani/vscode-numbered-bookmarks/pull/104))

## [8.0.3] - 2021-03-20
### Fixed
- Bookmarks on deleted/missing files breaks jumping (issue [#102](https://github.com/alefragnani/vscode-numbered-bookmarks/issues/102))
- Running the contributed command: 'numberedBookmarks.toggleBookmark1' failed (issue [#100](https://github.com/alefragnani/vscode-numbered-bookmarks/issues/100))
- Toggling bookmarks on Untitled documents does not work bug (issue [#99](https://github.com/alefragnani/vscode-numbered-bookmarks/issues/99))

## [8.0.2] - 2021-02-25
### Fixed
- Command `Toggle` not found - loading empty workspace with random files (issue [#97](https://github.com/alefragnani/vscode-numbered-bookmarks/issues/97))

## [8.0.1] - 2021-02-15
### Fixed
- Extension does not activate on VS Code 1.50 (issue [#98](https://github.com/alefragnani/vscode-numbered-bookmarks/issues/98))

## [8.0.0] - 2021-02-11
### Added
- Improvements on multi-root support (issue [#92](https://github.com/alefragnani/vscode-numbered-bookmarks/issues/92))
- Multi-platform support (issue [#94](https://github.com/alefragnani/vscode-numbered-bookmarks/issues/94))
- Support Remote Development (issue [#63](https://github.com/alefragnani/vscode-numbered-bookmarks/issues/63))
- Support Column position (issue [#14](https://github.com/alefragnani/vscode-numbered-bookmarks/issues/14))

### Fixed
- Error using `Toggle Bookmark` command with `saveBookmarksInProject` (issue [#69](https://github.com/alefragnani/vscode-numbered-bookmarks/issues/69))

### Internal
- Do not show welcome message if installed by Settings Sync (issue [#95](https://github.com/alefragnani/vscode-numbered-bookmarks/issues/95))

## [7.3.0] - 2021-01-12
### Added
- Support submenu for editor commands (issue [#84](https://github.com/alefragnani/vscode-numbered-bookmarks/issues/84))
- New setting to decide if should show a warning when a bookmark is not defined (issue [#73](https://github.com/alefragnani/vscode-numbered-bookmarks/issues/73))

### Fixed
- Typo in extension's configuration title (issue [#89](https://github.com/alefragnani/vscode-numbered-bookmarks/issues/89))

### Internal
- Shrink installation size (issue [#53](https://github.com/alefragnani/vscode-numbered-bookmarks/issues/53))
- Update whats-new submodule API (issue [#85](https://github.com/alefragnani/vscode-numbered-bookmarks/issues/85))

## [7.2.0] - 2020-09-16
### Internal
- Use `vscode-ext-codicons` package (issue [#80](https://github.com/alefragnani/vscode-numbered-bookmarks/issues/80))
- Migrate from TSLint to ESLint (issue [#75](https://github.com/alefragnani/vscode-numbered-bookmarks/issues/75))

## [7.1.3] - 2020-08-05
### Fixed
- Security Alert: elliptic (dependabot [PR #79](https://github.com/alefragnani/vscode-numbered-bookmarks/pull/79))
- Security Alert: lodash (dependabot [PR #77](https://github.com/alefragnani/vscode-numbered-bookmarks/pull/77))

## [7.1.2] - 2020-06-20
### Fixed
- Stars visibility on Marketplace (issue [#76](https://github.com/alefragnani/vscode-numbered-bookmarks/issues/76))

## [7.1.1] - 2020-05-10
### Fixed
- View context menu displayed erroneously (issue [#72](https://github.com/alefragnani/vscode-numbered-bookmarks/issues/72))

## [7.1.0] - 2020-05-09
### Fixed
- Navigation error on empty files (issue [#68](https://github.com/alefragnani/vscode-numbered-bookmarks/issues/68))

### Internal
- Support VS Code extension view context menu

## [7.0.0] - 2020-02-07
### Added
- Support `workbench.colorCustomizations` (issue [#61](https://github.com/alefragnani/vscode-numbered-bookmarks/issues/61))

### Internal
- Support VS Code package split
- Use `vscode-ext-decoration` package

## [6.2.1] - 2019-05-27
### Fixed
- Security Alert: tar

## [6.2.0] - 2019-03-25
### Added
- Improvements to README, describing commands and shortcuts (issue [#52](https://github.com/alefragnani/vscode-numbered-bookmarks/issues/52))
- Improvements to README, describing shortcut conflicts for MacOS users (issue [#40](https://github.com/alefragnani/vscode-numbered-bookmarks/issues/40))

### Fixed
- Selection issue when cutting text (issue [#48](https://github.com/alefragnani/vscode-numbered-bookmarks/issues/48))

## [6.1.1] - 2019-03-15
### Fixed
- What's New page broken in VS Code 1.32 due to CSS API changes

## [6.1.0] - 2018-12-17
### Added
- New settings to choose gutter icon colors (icon fill and number) (Thanks to @vasilev-alex [PR #45](https://github.com/alefragnani/vscode-numbered-bookmarks/pull/45))

## [6.0.0] - 2018-11-26
### Added
- What's New

## [5.2.0] - 2018-09-14
### Added
- New Setting to choose background color of bookmarked lines (Thanks to @ibraimgm [PR #44](https://github.com/alefragnani/vscode-numbered-bookmarks/pull/44))
- New Version Numbering based on `semver`

## [0.12.0 - 5.1.0] - 2018-09-14
### Added
- Patreon button

## [0.11.1 - 5.0.1] - 2018-03-09
### Fixed
- Error activating extension without workspace (folder) open (issue [#35](https://github.com/alefragnani/vscode-numbered-bookmarks/issues/35))

## [0.11.0 - 5.0.0] - 2017-11-13
### Added
- Multi-root support (issue [#30](https://github.com/alefragnani/vscode-numbered-bookmarks/issues/30))

## [0.10.0 - 4.0.0] - 2017-05-27
### Changed
- **TypeScript** and **VS Code engine** updated
- Source code moved to `src` folder
- Enabled **TSLint**
- Source code organization

### Fixed
- Error opening files outside the project in `List from All Files`  (issue [#26](https://github.com/alefragnani/vscode-numbered-bookmarks/issues/26))
- `List from All Files` command not working since VS Code 1.12 (issue [#25](https://github.com/alefragnani/vscode-numbered-bookmarks/issues/25))

## [0.9.1 - 3.1.1] - 2017-05-11
### Fixed
- Bookmarks disapearing/incorrectly moving when new lines are added above (issue [#23](https://github.com/alefragnani/vscode-numbered-bookmarks/issues/23))

## [0.9.0 - 3.1.0] - 2017-04-23
### Added
- New Setting to choose how bookmarks _Navigate Through All Files_ (issue [#6](https://github.com/alefragnani/vscode-numbered-bookmarks/issues/6))

## [0.8.0 - 3.0.0] - 2017-04-02
### Added
- New Setting to allow Bookmarks to be saved in the project (inside `.vscode` folder)

### Changed
- Bookmarks are now _always_ Sticky

## [0.7.0 - 2.4.0] - 2017-03-06
### Added
- Avoid unnecessary scrolling (issue [#18](https://github.com/alefragnani/vscode-numbered-bookmarks/issues/18))

## [0.6.0 - 2.3.0] - 2017-01-03
### Added
- Toggle Bookmark 0 and Jump to Bookmark 0 (PR [#16](https://github.com/alefragnani/vscode-numbered-bookmarks/pull/16) - kudos to @DeegC)

## [0.5.2 - 2.2.2] - 2016-12-03
### Added
- Tags added for Marketplace presentation

## [0.5.1 - 2.2.1] - 2016-12-03
### Fixed
- Bookmarks becomes invalid when documents are modified outside VSCode

## [0.5.0 - 2.2.0] - 2016-09-26
### Added
- New Command `List from all files`
- New Command `Clear from all files`

## [0.4.2 - 2.1.2] - 2016-09-19
### Fixed
- Bookmarks missing in _Insider release 1.6.0_ (issue [#11](https://github.com/alefragnani/vscode-numbered-bookmarks/issues/11))

## [0.4.1 - 2.1.1] - 2016-09-03
### Fixed
- Remove extension activation log (issue [#10](https://github.com/alefragnani/vscode-numbered-bookmarks/issues/10))

## [0.4.0 - 2.1.0] - 2016-06-17
### Added
- New Setting to Sticky Bookmarks 

## [0.3.0 - 2.0.0] - 2016-03-08
### Added
- Bookmarks are also rendered in the overview ruler

### Fixed
- Incompatibility with **Code February Release** 0.10.10 (issue [#4](https://github.com/alefragnani/vscode-numbered-bookmarks/issues/4))

## [0.2.0 - 1.0.0] - 2016-02-15
### Added
- New Command `List`

## [0.1.0 - 0.9.0] - 2016-02-06

* Initial release
