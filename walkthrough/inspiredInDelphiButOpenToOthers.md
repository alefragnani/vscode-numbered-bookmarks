## Inpired in Delphi, but open to others

The extension was inspired in Delphi, because I was a Delphi developer for a long time, and love it's bookmarks. But it supports different editors as well.

To change a bit how the extension works (toggling and navigation), simply play with the `numberedBookmarks.navigateThroughAllFiles` setting:

Value | Explanation
--------- | ---------
`false` | _default_ - same behavior as today
`replace` | you can't have the same numbered bookmark in different files
`allowDuplicates` | you can have the same numbered bookmark in different files, and if you jump repeatedly to the same number, it will look on other files.

### IntelliJ / UltraEdit developers

If you are an **IntelliJ** or **UltraEdit** user, you will notice the numbered bookmarks works a bit different from the default behavior. 

To make **Numbered Bookmarks** works the same way as these other tools, simply add `"numberedBookmarks.navigateThroughAllFiles": replace"` to your setting and you are good to go.

<table align="center" width="85%" border="0">
  <tr>
    <td align="center">
      <a title="Open Settings" href="command:workbench.action.openSettings?%5B%22numberedBookmarks.navigateThroughAllFiles%22%5D">Open Settings</a>
    </td>
  </tr>
</table>