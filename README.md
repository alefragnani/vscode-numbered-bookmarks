# Functionality

Mark lines in the editor and easily jump to them. _In Delphi style._

# Usage

## Available commands

* **Numbered Bookmarks: Toggle Bookmark _'number'_** Mark/unmark the current line with a numbered bookmark
* **Numbered Bookmarks: Jump to Bookmark _'number'_** Move the cursor to the numbered bookmark
* **Numbered Bookmarks: Clear** remove all bookmarks from the current file

> Both **Toggle** and **Jump to Bookmark** commands are numbered from 1 to 9

![Commands](images/numbered-bookmarks-commands.png)

### Toggle Bookmark _'number'_

You can easily Mark/Unmark bookmarks on any line. Works even for wrapped lines.

![Toggle](images/numbered-bookmarks-toggle.png)

## Available settings

* Allow bookmarks to be saved and restored, even if you close or change the Project
```
    "bookmarks.saveBookmarksBetweenSessions": true
```

## Project and Session Based

The bookmarks are saved _per session_ for the project that you are using. You don't have to worry about closing files in _Working Files_. When you reopen the file, the bookmarks are restored.

It also works even if you only _preview_ a file (simple click in TreeView). You can put bookmarks in any file and when you preview it again, the bookmarks will be there.

# TODO List

Here are some ideas that will be added soon:

* **Preview bookmarked lines:** Create a new command (**Bookmarks: List**) that will show all bookmarked lines, with its content, so you easily identify which bookmark you would want to go.

# Known Issues

- Hiting `Enter` in lines with bookmarks, temporarily also moves the bookmarks, but when you stop typing, the bookmark is correctly presented on the original line.

# Changelog

## Version 0.1.0

* Initial release

# Participate

If you have any idea, feel free to create issues and pull requests

# License

[MIT](LICENSE.md) &copy; Alessandro Fragnani

---

[![Paypal Donations](https://www.paypalobjects.com/en_US/i/btn/btn_donate_SM.gif)](https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=EP57F3B6FXKTU&lc=US&item_name=Alessandro%20Fragnani&item_number=vscode%20extensions&currency_code=USD&bn=PP%2dDonationsBF%3abtn_donate_SM%2egif%3aNonHosted) if you enjoy using this extension :-)