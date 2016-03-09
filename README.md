# Functionality

Mark lines in the editor and easily jump to them. _In Delphi style._
# Installation

Press `F1` in VSCode, type `ext install` and then look for `Numbered Bookmarks`.

# Usage

## Available commands

* **Numbered Bookmarks: Toggle Bookmark _'number'_** Mark/unmark the current line with a numbered bookmark
* **Numbered Bookmarks: Jump to Bookmark _'number'_** Move the cursor to the numbered bookmark
* **Numbered Bookmarks: List** List all bookmarks from the current file
* **Numbered Bookmarks: Clear** remove all bookmarks from the current file

> Both **Toggle** and **Jump to Bookmark** commands are numbered from 1 to 9

![Commands](images/numbered-bookmarks-commands.png)

### Numbered Bookmarks: Toggle Bookmark _'number'_

You can easily Mark/Unmark bookmarks on any line. Works even for wrapped lines.

![Toggle](images/numbered-bookmarks-toggle.png)

> _new in version 0.2.0_  

### Numbered Bookmarks: List

List all bookmarks from the current file and easily navigate to any one. It shows you the line contents and temporarily scroll to that line.

![List](images/numbered-bookmarks-list.gif)

## Available settings

* Allow bookmarks to be saved and restored, even if you close or change the Project
```
    "numberedBookmarks.saveBookmarksBetweenSessions": true
```

## Project and Session Based

The bookmarks are saved _per session_ for the project that you are using. You don't have to worry about closing files in _Working Files_. When you reopen the file, the bookmarks are restored.

It also works even if you only _preview_ a file (simple click in TreeView). You can put bookmarks in any file and when you preview it again, the bookmarks will be there.

# Known Issues

- Hiting `Enter` in lines with bookmarks, temporarily also moves the bookmarks, but when you stop typing, the bookmark is correctly presented on the original line.

# Changelog

## Version 0.3.0

* **New:** Bookmarks are also rendered in the overview ruler
* **Fix:** Incompatibility with **Code February Release** 0.10.10 (issue [#4](https://github.com/alefragnani/vscode-numbered-bookmarks/issues/4))

## Version 0.2.0

* **New Command:** List all bookmarks from the current file

## Version 0.1.0

* Initial release

# Participate

If you have any idea, feel free to create issues and pull requests

# License

[MIT](LICENSE.md) &copy; Alessandro Fragnani

---

[![Paypal Donations](https://www.paypalobjects.com/en_US/i/btn/btn_donate_SM.gif)](https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=EP57F3B6FXKTU&lc=US&item_name=Alessandro%20Fragnani&item_number=vscode%20extensions&currency_code=USD&bn=PP%2dDonationsBF%3abtn_donate_SM%2egif%3aNonHosted) if you enjoy using this extension :-)