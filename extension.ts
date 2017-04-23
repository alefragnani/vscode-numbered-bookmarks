// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import path = require('path');
import fs = require('fs');

// this method is called when vs code is activated
export function activate(context: vscode.ExtensionContext) {
	
    let activeEditorCountLine: number;

    const MAX_BOOKMARKS = 10;
    const NO_BOOKMARK_DEFINED = -1;

    class Bookmark {
        fsPath: string;
        bookmarks: number[]; 

        constructor(fsPath: string) {
            this.fsPath = fsPath;
            this.bookmarks = [];
            this.bookmarks.length = MAX_BOOKMARKS;
            this.resetBookmarks();
        }

        public resetBookmarks() {
            for (var index = 0; index < MAX_BOOKMARKS; index++) {
                this.bookmarks[index] = NO_BOOKMARK_DEFINED;
            }
        }
        
        public listBookmarks() {
            
            return new Promise((resolve, reject) => {
                
                if (this.bookmarks.length == 0) {
                    resolve({});
                    return;
                }
                
                if (!fs.existsSync(this.fsPath)) {
                    resolve({});
                    return;
                }
                
                let uriDocBookmark: vscode.Uri = vscode.Uri.file(this.fsPath);
                vscode.workspace.openTextDocument(uriDocBookmark).then(doc => {    
                    
                    let items = [];
                    let invalids = [];
                    for (var index = 0; index < this.bookmarks.length; index++) {
                        var element = this.bookmarks[index];
                        // fix for modified files
                        if (element != NO_BOOKMARK_DEFINED) {
                        //if ((element != NO_BOOKMARK_DEFINED) && (element <= doc.lineCount)) {
                            if (element <= doc.lineCount) {
                                let lineText = doc.lineAt(element).text;
                                let normalizedPath = doc.uri.fsPath;
                                element++;
                                items.push({
                                    label: element.toString(),
                                    description: lineText,
                                    detail: normalizedPath
                                });  
                            } else {
                                invalids.push(element);
                            }
                        }
                    }

                    if (invalids.length > 0) {                
                        for (let indexI = 0; indexI < invalids.length; indexI++) {
                            activeBookmark.bookmarks[invalids[indexI]] = NO_BOOKMARK_DEFINED;
                        }
                    }
                    
                    resolve(items);
                    return;
                });
            })
        }        
    }

    class Bookmarks {
        bookmarks: Bookmark[];

        constructor() {
            this.bookmarks = [];
        }

        public loadFrom(jsonObject, relativePath?) {
            if (jsonObject == '') {
                return;
            }
            
            let jsonBookmarks = jsonObject.bookmarks;
            for (var idx = 0; idx < jsonBookmarks.length; idx++) {
              let jsonBookmark = jsonBookmarks[idx];
              
              // each bookmark (line)
              this.add(jsonBookmark.fsPath);
              for (let index = 0; index < jsonBookmark.bookmarks.length; index++) {
                  this.bookmarks[idx].bookmarks[index] = jsonBookmark.bookmarks[index];
              }
            }
            
            if (relativePath) {
                for (let element of this.bookmarks) {
                    element.fsPath = element.fsPath.replace("$ROOTPATH$", vscode.workspace.rootPath);
                }
            }            
        }

        fromUri(uri: string) {
            for (var index = 0; index < this.bookmarks.length; index++) {
                var element = this.bookmarks[index];

                if (element.fsPath == uri) {
                    return element;
                }
            }
        }

        indexFromUri(uri: string) {
            for (var index = 0; index < this.bookmarks.length; index++) {
                var element = this.bookmarks[index];

                if (element.fsPath == uri) {
                    return index;
                }
            }
        }

        add(uri: string) {
            let existing: Bookmark = this.fromUri(uri);
            if (typeof existing == 'undefined') {
                var bookmark = new Bookmark(uri);
                this.bookmarks.push(bookmark);
            }
        }

        zip(relativePath?: boolean): Bookmarks {
            function isNotEmpty(book: Bookmark): boolean {
                // return book.bookmarks.length > 0;
                let hasAny: boolean = false;
                for (let index = 0; index < book.bookmarks.length; index++) {
                    let element = book.bookmarks[index];
                    hasAny = element != NO_BOOKMARK_DEFINED;
                    if (hasAny) {
                        break;
                    }
                }
                return hasAny;
            }
            
            let newBookmarks: Bookmarks = new Bookmarks();
            //  newBookmarks.bookmarks = this.bookmarks.filter(isNotEmpty);
            newBookmarks.bookmarks = JSON.parse(JSON.stringify(this.bookmarks)).filter(isNotEmpty);

            if (!relativePath) {
                return newBookmarks;
            }

            for (let element of newBookmarks.bookmarks) {
                element.fsPath = element.fsPath.replace(vscode.workspace.rootPath, "$ROOTPATH$");
            }
            return newBookmarks;
        }        
    }

    var bookmarks: Bookmarks;
	
    // load pre-saved bookmarks
    let didLoadBookmarks: boolean = loadWorkspaceState();


    let bookmarkDecorationType: vscode.TextEditorDecorationType[] = [];
    bookmarkDecorationType.length = MAX_BOOKMARKS;
    for (var index = 0; index < MAX_BOOKMARKS; index++) {
        let pathIcon: string = context.asAbsolutePath('images\\bookmark' + index + '.png');
        pathIcon = pathIcon.replace(/\\/g, "/");
        bookmarkDecorationType[index] = vscode.window.createTextEditorDecorationType({
            gutterIconPath: pathIcon,
            overviewRulerLane: vscode.OverviewRulerLane.Full,
            overviewRulerColor: 'rgba(1, 255, 33, 0.7)'           
        });
    }
    

    // Connect it to the Editors Events
    var activeEditor = vscode.window.activeTextEditor;
    var activeBookmark: Bookmark;

    if (activeEditor) {
        if (!didLoadBookmarks) {
            bookmarks.add(activeEditor.document.uri.fsPath);
        }
		activeEditorCountLine = activeEditor.document.lineCount;
        activeBookmark = bookmarks.fromUri(activeEditor.document.uri.fsPath);
        triggerUpdateDecorations();
    }
	
    // new docs
    vscode.workspace.onDidOpenTextDocument(doc => {
		activeEditorCountLine = doc.lineCount;
        bookmarks.add(doc.uri.fsPath);
    });

    vscode.window.onDidChangeActiveTextEditor(editor => {
        activeEditor = editor;
        if (editor) {
			activeEditorCountLine = editor.document.lineCount;
            activeBookmark = bookmarks.fromUri(editor.document.uri.fsPath);
            triggerUpdateDecorations();
        }
    }, null, context.subscriptions);

    vscode.workspace.onDidChangeTextDocument(event => {
        if (activeEditor && event.document === activeEditor.document) {
            //triggerUpdateDecorations();
			let updatedBookmark: boolean = true;
			// call sticky function when the activeEditor is changed
			if (activeBookmark && activeBookmark.bookmarks.length > 0) {
				updatedBookmark = stickyBookmarks(event);
			}
			
			activeEditorCountLine = event.document.lineCount;
			updateDecorations();

			if (updatedBookmark) {
				saveWorkspaceState();
			}
        }
    }, null, context.subscriptions);

    // Timeout
    var timeout = null;
    function triggerUpdateDecorations() {
        if (timeout) {
            clearTimeout(timeout);
        }
        timeout = setTimeout(updateDecorations, 100);
    }

    function getDecoration(n: number): vscode.TextEditorDecorationType {
        return bookmarkDecorationType[n];
    }
	
    // Evaluate (prepare the list) and DRAW
    function updateDecorations() {
        if (!activeEditor) {
            return;
        }

        if (!activeBookmark) {
            return;
        }

        var books: vscode.Range[] = [];
        // Remove all bookmarks if active file is empty
		if (activeEditor.document.lineCount === 1 && activeEditor.document.lineAt(0).text === "") {
			activeBookmark.bookmarks = [];
		} else {
            let invalids = [];
            for (var index = 0; index < MAX_BOOKMARKS; index++) {
                books = [];
                if (activeBookmark.bookmarks[index] < 0) {
                    activeEditor.setDecorations(getDecoration(index), books);
                } else {
                    var element = activeBookmark.bookmarks[index];
                    if (element < activeEditor.document.lineCount) {
                        var decoration = new vscode.Range(element, 0, element, 0);
                        books.push(decoration);
                        activeEditor.setDecorations(getDecoration(index), books);
                    } else {
                        invalids.push(index);
                    }
                }
            }

            if (invalids.length > 0) {                
                for (let indexI = 0; indexI < invalids.length; indexI++) {
                    activeBookmark.bookmarks[invalids[indexI]] = NO_BOOKMARK_DEFINED;
                }
            }
        }
    }
	
	
    // other commands
    vscode.commands.registerCommand('numberedBookmarks.toggleBookmark0', () => {
        toggleBookmark(0, vscode.window.activeTextEditor.selection.active.line);
    });

    vscode.commands.registerCommand('numberedBookmarks.toggleBookmark1', () => {
        toggleBookmark(1, vscode.window.activeTextEditor.selection.active.line);
    });

    vscode.commands.registerCommand('numberedBookmarks.toggleBookmark2', () => {
        toggleBookmark(2, vscode.window.activeTextEditor.selection.active.line);
    });

    vscode.commands.registerCommand('numberedBookmarks.toggleBookmark3', () => {
        toggleBookmark(3, vscode.window.activeTextEditor.selection.active.line);
    });

    vscode.commands.registerCommand('numberedBookmarks.toggleBookmark4', () => {
        toggleBookmark(4, vscode.window.activeTextEditor.selection.active.line);
    });

    vscode.commands.registerCommand('numberedBookmarks.toggleBookmark5', () => {
        toggleBookmark(5, vscode.window.activeTextEditor.selection.active.line);
    });

    vscode.commands.registerCommand('numberedBookmarks.toggleBookmark6', () => {
        toggleBookmark(6, vscode.window.activeTextEditor.selection.active.line);
    });

    vscode.commands.registerCommand('numberedBookmarks.toggleBookmark7', () => {
        toggleBookmark(7, vscode.window.activeTextEditor.selection.active.line);
    });

    vscode.commands.registerCommand('numberedBookmarks.toggleBookmark8', () => {
        toggleBookmark(8, vscode.window.activeTextEditor.selection.active.line);
    });

    vscode.commands.registerCommand('numberedBookmarks.toggleBookmark9', () => {
        toggleBookmark(9, vscode.window.activeTextEditor.selection.active.line);
    });

    vscode.commands.registerCommand('numberedBookmarks.jumpToBookmark0', () => {
        jumpToBookmark(0);
    });

    vscode.commands.registerCommand('numberedBookmarks.jumpToBookmark1', () => {
        jumpToBookmark(1);
    });

    vscode.commands.registerCommand('numberedBookmarks.jumpToBookmark2', () => {
        jumpToBookmark(2);
    });

    vscode.commands.registerCommand('numberedBookmarks.jumpToBookmark3', () => {
        jumpToBookmark(3);
    });

    vscode.commands.registerCommand('numberedBookmarks.jumpToBookmark4', () => {
        jumpToBookmark(4);
    });

    vscode.commands.registerCommand('numberedBookmarks.jumpToBookmark5', () => {
        jumpToBookmark(5);
    });

    vscode.commands.registerCommand('numberedBookmarks.jumpToBookmark6', () => {
        jumpToBookmark(6);
    });

    vscode.commands.registerCommand('numberedBookmarks.jumpToBookmark7', () => {
        jumpToBookmark(7);
    });

    vscode.commands.registerCommand('numberedBookmarks.jumpToBookmark8', () => {
        jumpToBookmark(8);
    });

    vscode.commands.registerCommand('numberedBookmarks.jumpToBookmark9', () => {
        jumpToBookmark(9);
    });

    vscode.commands.registerCommand('numberedBookmarks.clear', () => {
        for (var index = 0; index < MAX_BOOKMARKS; index++) {
            activeBookmark.resetBookmarks();
        }

        saveWorkspaceState();
        updateDecorations();
    });
    
    vscode.commands.registerCommand('numberedBookmarks.clearFromAllFiles', () => {
        
        for (let index = 0; index < bookmarks.bookmarks.length; index++) {
            let element = bookmarks.bookmarks[index];
            element.resetBookmarks();
        }
      
        saveWorkspaceState();
        updateDecorations();
    });
    

    vscode.commands.registerCommand('numberedBookmarks.list', () => {
        // no bookmark
        if (activeBookmark.bookmarks.length == 0) {
            vscode.window.showInformationMessage("No Bookmark found");
            return;
        }

        // push the items
        let items: vscode.QuickPickItem[] = [];
        for (var index = 0; index < activeBookmark.bookmarks.length; index++) {
            let element = activeBookmark.bookmarks[index];
            // > -> temporary fix for modified files
            if ((element != -1) && (element <= vscode.window.activeTextEditor.document.lineCount)) {
                let lineText = vscode.window.activeTextEditor.document.lineAt(element).text;
                element++;
                items.push({ label: element.toString(), description: lineText });
            }
        }
		
        // pick one
        let currentLine: number = vscode.window.activeTextEditor.selection.active.line + 1;
        let options = <vscode.QuickPickOptions>{
            placeHolder: 'Type a line number or a piece of code to navigate to',
            matchOnDescription: true,
            matchOnDetail: true,
            onDidSelectItem: item => {
                revealLine(parseInt(item.label) - 1);
            }
        };

        vscode.window.showQuickPick(items, options).then(selection => {
            if (typeof selection == 'undefined') {
                revealLine(currentLine - 1);
                return;
            }
            revealLine(parseInt(selection.label) - 1);
        });
    });


     vscode.commands.registerCommand('numberedBookmarks.listFromAllFiles', () => {

        // no bookmark
        let totalBookmarkCount: number = 0;
        for (let index = 0; index < bookmarks.bookmarks.length; index++) {
            totalBookmarkCount = totalBookmarkCount + bookmarks.bookmarks[index].bookmarks.length;
        }
        if (totalBookmarkCount == 0) {
            vscode.window.showInformationMessage("No Bookmarks found");
            return;
        }

        // push the items
        let items: vscode.QuickPickItem[] = [];
        let activeTextEditorPath = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.document.uri.fsPath : '';
        let promisses = [];
        let currentLine: number = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.selection.active.line + 1 : -1;
        
        for (var index = 0; index < bookmarks.bookmarks.length; index++) {
            let bookmark = bookmarks.bookmarks[index];
            
            let pp = bookmark.listBookmarks();
            promisses.push(pp);
        }
        
        Promise.all(promisses).then(
          (values) => {
              
              for (var index = 0; index < values.length; index++) {
                  var element = values[index];

                  for (var indexInside = 0; indexInside < element.length; indexInside++) {
                      var elementInside = element[indexInside];

                      if (elementInside.detail.toString().toLowerCase() == activeTextEditorPath.toLowerCase()) {
                          items.push(
                              {
                                  label: elementInside.label,
                                  description: elementInside.description
                              }
                          );
                      } else {
                          let itemPath = removeRootPathFrom(elementInside.detail);
                          items.push(
                              {
                                  label: elementInside.label,
                                  description: elementInside.description,
                                  detail: itemPath
                              }
                          );
                      }
                  }

              }

              // sort
              // - active document
              // - no octicon - document inside project
              // - with octicon - document outside project
              let itemsSorted: vscode.QuickPickItem[];
              itemsSorted = items.sort(function (a: vscode.QuickPickItem, b: vscode.QuickPickItem): number {
                  if (!a.detail && !b.detail) {
                      return 0;
                  } else {
                      if (!a.detail && b.detail) {
                          return -1
                      } else {
                          if (a.detail && !b.detail) {
                              return 1;
                          } else {
                              if ((a.detail.toString().indexOf('$(file-directory) ') == 0) && (b.detail.toString().indexOf('$(file-directory) ') == -1)) {
                                  return 1
                              } else {
                                  if ((a.detail.toString().indexOf('$(file-directory) ') == -1) && (b.detail.toString().indexOf('$(file-directory) ') == 0)) {
                                      return -1
                                  } else {
                                      return 0;
                                  }
                              }
                          }
                      }
                  }
              });

              let options = <vscode.QuickPickOptions>{
                  placeHolder: 'Type a line number or a piece of code to navigate to',
                  matchOnDescription: true,
                  onDidSelectItem: item => {

                      let filePath: string;
                      // no detail - previously active document
                      if (!item.detail) {
                          filePath = activeTextEditorPath;
                      } else {
                          // with octicon - document outside project
                          if (item.detail.toString().indexOf('$(file-directory) ') == 0) {
                              filePath = item.detail.toString().split('$(file-directory) ').pop();
                          } else {// no octicon - document inside project
                              filePath = vscode.workspace.rootPath + item.detail.toString();
                          }
                      }

                      if (vscode.window.activeTextEditor && vscode.window.activeTextEditor.document.uri.fsPath.toLowerCase() == filePath.toLowerCase()) {
                          revealLine(parseInt(item.label) - 1);
                      } else {
                        let uriDocument: vscode.Uri = vscode.Uri.file(filePath);
                        vscode.workspace.openTextDocument(uriDocument).then(doc => {
                            vscode.window.showTextDocument(doc, undefined, true).then(editor => {
                                revealLine(parseInt(item.label) - 1);
                            });
                        });
                      }                  
                  }
              };
              vscode.window.showQuickPick(itemsSorted, options).then(selection => {
                  if (typeof selection == 'undefined') {
                      if (activeTextEditorPath == '') {
                          vscode.commands.executeCommand('workbench.action.closeActiveEditor');
                          return;
                      } else {
                        let uriDocument: vscode.Uri = vscode.Uri.file(activeTextEditorPath);
                        vscode.workspace.openTextDocument(uriDocument).then(doc => {
                            vscode.window.showTextDocument(doc).then(editor => {
                                revealLine(currentLine - 1);
                                return;
                            });
                        });                          
                      }
                  }
                  
                  if (typeof selection == 'undefined') {
                      return;
                  }

                  if (!selection.detail) {
                      revealLine(parseInt(selection.label) - 1);
                  } else {
                      let newPath = vscode.workspace.rootPath + selection.detail.toString();
                      let uriDocument: vscode.Uri = vscode.Uri.file(newPath);
                      vscode.workspace.openTextDocument(uriDocument).then(doc => {
                          vscode.window.showTextDocument(doc).then(editor => {
                              revealLine(parseInt(selection.label) - 1);
                          });
                      });
                  }
              });
            }  
        );
    });


    

    function revealLine(line: number, directJump?: boolean) {
        var newSe = new vscode.Selection(line, 0, line, 0);
        vscode.window.activeTextEditor.selection = newSe;
        if (directJump) {
            vscode.window.activeTextEditor.revealRange(newSe, vscode.TextEditorRevealType.InCenterIfOutsideViewport);
        } else {
            vscode.window.activeTextEditor.revealRange(newSe, vscode.TextEditorRevealType.InCenter);
        }
    }

    function loadWorkspaceState(): boolean {
        // let saveBookmarksBetweenSessions: boolean = vscode.workspace.getConfiguration('numberedBookmarks').get('saveBookmarksBetweenSessions', false);
        // bookmarks = new Bookmarks();

        // let savedBookmarks = context.workspaceState.get('numberedBookmarks', '');
        // if (savedBookmarks != '') {
        //     bookmarks.loadFrom(JSON.parse(savedBookmarks));
        // }
        // return savedBookmarks != '';
        let saveBookmarksInProject: boolean = vscode.workspace.getConfiguration("numberedBookmarks").get("saveBookmarksInProject", false);

        bookmarks = new Bookmarks();

        if (vscode.workspace.rootPath && saveBookmarksInProject) {
            let bookmarksFileInProject: string = path.join(vscode.workspace.rootPath, ".vscode", "numbered-bookmarks.json");
            if (!fs.existsSync(bookmarksFileInProject)) {
                return false;
            }
            try {
                bookmarks.loadFrom(JSON.parse(fs.readFileSync(bookmarksFileInProject).toString()), true);
                return true;
            } catch (error) {
                vscode.window.showErrorMessage("Error loading Numbered Bookmarks: " + error.toString());
                return false;
            }
        } else {
            let savedBookmarks = context.workspaceState.get("numberedBookmarks", "");
            if (savedBookmarks !== "") {
                bookmarks.loadFrom(JSON.parse(savedBookmarks));
            }
            return savedBookmarks !== "";
        }        
    }

    function saveWorkspaceState(): void {
        // let saveBookmarksBetweenSessions: boolean = vscode.workspace.getConfiguration('numberedBookmarks').get('saveBookmarksBetweenSessions', false);
        // if (!saveBookmarksBetweenSessions) {
        //     return;
        // }

        // context.workspaceState.update('numberedBookmarks', JSON.stringify(bookmarks));
        let saveBookmarksInProject: boolean = vscode.workspace.getConfiguration("numberedBookmarks").get("saveBookmarksInProject", false);

        if (vscode.workspace.rootPath && saveBookmarksInProject) {
            let bookmarksFileInProject: string = path.join(vscode.workspace.rootPath, ".vscode", "numbered-bookmarks.json");
            if (!fs.existsSync(path.dirname(bookmarksFileInProject))) {
                fs.mkdirSync(path.dirname(bookmarksFileInProject)); 
            }
            fs.writeFileSync(bookmarksFileInProject, JSON.stringify(bookmarks.zip(true), null, "\t"));   
        } else {
            context.workspaceState.update("numberedBookmarks", JSON.stringify(bookmarks.zip()));
        }
    }

    function toggleBookmark(n: number, line: number) {
        // fix issue emptyAtLaunch
        if (!activeBookmark) {
            bookmarks.add(vscode.window.activeTextEditor.document.uri.fsPath);
            activeBookmark = bookmarks.fromUri(vscode.window.activeTextEditor.document.uri.fsPath);
        }     

        // there is another bookmark already set for this line?
        let index: number = activeBookmark.bookmarks.indexOf(line);
        if (index >= 0) {
            clearBookmark(index);
        }

        // if was myself, then I want to 'remove'
        if (index != n) {
            activeBookmark.bookmarks[ n ] = line;

            // when _toggling_ only "replace" differs, because it has to _invalidate_ that bookmark from other files 
            let navigateThroughAllFiles: string = vscode.workspace.getConfiguration("numberedBookmarks").get("navigateThroughAllFiles", "false");
            if (navigateThroughAllFiles === "replace") {
                for (let index = 0; index < bookmarks.bookmarks.length; index++) {
                    let element = bookmarks.bookmarks[index];
                    if (element.fsPath !== activeBookmark.fsPath) {
                        element.bookmarks[n] = NO_BOOKMARK_DEFINED;
                    }
                }
            }        
        }

        saveWorkspaceState();
        updateDecorations();
    }

    function clearBookmark(n: number) {
        activeBookmark.bookmarks[n] = NO_BOOKMARK_DEFINED;
    }

    function jumpToBookmark(n: number) {
        if (!activeBookmark) {
            return;
        }

        // when _jumping_ each config has its own behavior 
        let navigateThroughAllFiles: string = vscode.workspace.getConfiguration("numberedBookmarks").get("navigateThroughAllFiles", "false");
        switch (navigateThroughAllFiles) {
            case "replace":
                // is it already set?
                if (activeBookmark.bookmarks[n] < 0) {

                    // no, look for another document that contains that bookmark 
                    // I can start from the first because _there is only one_
                    for (let index = 0; index < bookmarks.bookmarks.length; index++) {
                        let element = bookmarks.bookmarks[index];
                        if ((element.fsPath !== activeBookmark.fsPath) && (element.bookmarks[n] !== NO_BOOKMARK_DEFINED)) {
                            // open and novigate
                            let uriDocument: vscode.Uri = vscode.Uri.file(element.fsPath);
                            vscode.workspace.openTextDocument(uriDocument).then(doc => {
                                vscode.window.showTextDocument(doc, undefined, false).then(editor => {
                                    revealLine(element.bookmarks[n]);
                                });
                            });
                        }
                    }
                } else {
                    revealLine(activeBookmark.bookmarks[n], true);
                }		                

                break;
        
            case "allowDuplicates":

                // this file has, and I'm not in the line
                if ((activeBookmark.bookmarks[n] > NO_BOOKMARK_DEFINED) && 
                    (activeBookmark.bookmarks[n] !== vscode.window.activeTextEditor.selection.active.line)) {
                    revealLine(activeBookmark.bookmarks[n], true);  
                    break;  
                }

                // no, look for another document that contains that bookmark 
                // I CAN'T start from the first because _there can be duplicates_
                let currentFile: number = bookmarks.indexFromUri(activeBookmark.fsPath);
                let found: boolean = false;

                // to the end
                for (let index = currentFile; index < bookmarks.bookmarks.length; index++) {
                    let element = bookmarks.bookmarks[index];
                    if ((!found) && (element.fsPath !== activeBookmark.fsPath) && (element.bookmarks[n] !== NO_BOOKMARK_DEFINED)) {
                        found = true;
                        // open and novigate
                        let uriDocument: vscode.Uri = vscode.Uri.file(element.fsPath);
                        vscode.workspace.openTextDocument(uriDocument).then(doc => {
                            vscode.window.showTextDocument(doc, undefined, false).then(editor => {
                                revealLine(element.bookmarks[n]);
                            });
                        });
                    }
                }

                if (!found) {
                    for (let index = 0; index < currentFile; index++) {
                        let element = bookmarks.bookmarks[index];
                        if ((!found) && (element.fsPath !== activeBookmark.fsPath) && (element.bookmarks[n] !== NO_BOOKMARK_DEFINED)) {
                            // open and novigate
                            found = true;
                            let uriDocument: vscode.Uri = vscode.Uri.file(element.fsPath);
                            vscode.workspace.openTextDocument(uriDocument).then(doc => {
                                vscode.window.showTextDocument(doc, undefined, false).then(editor => {
                                    revealLine(element.bookmarks[n]);
                                });
                            });
                        }
                    }
                }
            
                break;
        
            default: // "false"
                // is it already set?
                if (activeBookmark.bookmarks[n] < 0) {
                    vscode.window.setStatusBarMessage('The Bookmark ' + n + ' is not defined', 3000);
                    return;
                }				
                revealLine(activeBookmark.bookmarks[n], true);

                break;
        }
    }

    //............................................................................................

	// function used to attach bookmarks at the line
	function stickyBookmarks(event): boolean {
        // sticky is now the default/only behavior        
        // let useStickyBookmarks: boolean = vscode.workspace.getConfiguration('numberedBookmarks').get('useStickyBookmarks', false);
        // if (!useStickyBookmarks) {
        //     return false;
        // }
        
		let diffLine: number;
		let updatedBookmark: boolean = false;

		if (event.contentChanges.length === 1) {
			// add or delete line case
			if (event.document.lineCount != activeEditorCountLine) {
			if (event.document.lineCount > activeEditorCountLine) {
				diffLine = event.document.lineCount - activeEditorCountLine;
			} else if (event.document.lineCount < activeEditorCountLine) {
				diffLine = activeEditorCountLine - event.document.lineCount;
				diffLine = 0 - diffLine;
                
                // one line up
                if (event.contentChanges[0].range.end.line - event.contentChanges[0].range.start.line == 1) {
                    
                   if ((event.contentChanges[0].range.end.character == 0) &&
                      (event.contentChanges[0].range.start.character == 0)) { 
                        // the bookmarked one
                        let idxbk = activeBookmark.bookmarks.indexOf(event.contentChanges[0].range.start.line);
                        if (idxbk > -1) {
                            activeBookmark.bookmarks[idxbk] = NO_BOOKMARK_DEFINED;
                        }
                   }
                }
                
                
                
                if (event.contentChanges[0].range.end.line - event.contentChanges[0].range.start.line > 1) {                
                    for (let i = event.contentChanges[0].range.start.line/* + 1*/; i <= event.contentChanges[0].range.end.line; i++) {
                        let index = activeBookmark.bookmarks.indexOf(i);
                        
                        if (index > -1) {
                            activeBookmark.bookmarks[index] = NO_BOOKMARK_DEFINED;
                            updatedBookmark = true;
                        }
                    }
                    }
			}

			for (let index in activeBookmark.bookmarks) {
				let eventLine = event.contentChanges[0].range.start.line;
                let eventcharacter = event.contentChanges[0].range.start.character; 

                // also =
				if ( 
                    ((activeBookmark.bookmarks[index] > eventLine) && (eventcharacter > 0)) ||
                    ((activeBookmark.bookmarks[index] >= eventLine) && (eventcharacter == 0))
                   ) {
					let newLine = activeBookmark.bookmarks[index] + diffLine;
					if (newLine < 0) {
						newLine = 0;
					}

					activeBookmark.bookmarks[index] = newLine;
					updatedBookmark = true;
				}
			}
		}

		// paste case
		if (event.contentChanges[0].text.length > 1) {
			let selection = vscode.window.activeTextEditor.selection;
			let lineRange = [selection.start.line, selection.end.line];
			let lineMin = Math.min.apply(this, lineRange);
			let lineMax = Math.max.apply(this, lineRange);

			if (selection.start.character > 0) {
				lineMin++;
			}

			if (selection.end.character < vscode.window.activeTextEditor.document.lineAt(selection.end).range.end.character) {
				lineMax--;
			}

			if (lineMin <= lineMax) {
				for (let i = lineMin; i <= lineMax; i++) {
				let index = activeBookmark.bookmarks.indexOf(i);
				if (index > -1) {
					activeBookmark.bookmarks[index] = NO_BOOKMARK_DEFINED;
					updatedBookmark = true;
				}
				}
			}
		}
	} else if (event.contentChanges.length === 2) {
		// move line up and move line down case
		if (activeEditor.selections.length === 1) {
			if (event.contentChanges[0].text === '') {
				updatedBookmark = moveStickyBookmarks('down');
			} else if (event.contentChanges[1].text === '') {
				updatedBookmark = moveStickyBookmarks('up');
			}
		}
	}

		return updatedBookmark;
	}

	function moveStickyBookmarks(direction): boolean {
		let diffChange: number = -1;
		let updatedBookmark: boolean = false;
		let diffLine;
		let selection = activeEditor.selection;
		let lineRange = [selection.start.line, selection.end.line];
		let lineMin = Math.min.apply(this, lineRange);
		let lineMax = Math.max.apply(this, lineRange);

		if (selection.end.character === 0 && !selection.isSingleLine) {
			let lineAt = activeEditor.document.lineAt(selection.end.line);
			let posMin = new vscode.Position(selection.start.line + 1, selection.start.character);
			let posMax = new vscode.Position(selection.end.line, lineAt.range.end.character);
			vscode.window.activeTextEditor.selection = new vscode.Selection(posMin, posMax);
			lineMax--;
		}

		if (direction === 'up') {
			diffLine = 1;

			let index = activeBookmark.bookmarks.indexOf(lineMin - 1);
			if (index > -1) {
				diffChange = lineMax;
				activeBookmark.bookmarks[index] = NO_BOOKMARK_DEFINED;
				updatedBookmark = true;
			}
		} else if (direction === 'down') {
			diffLine = -1;

			let index: number;
			index = activeBookmark.bookmarks.indexOf(lineMax + 1);
			if (index > -1) {
				diffChange = lineMin;
				activeBookmark.bookmarks[index] = NO_BOOKMARK_DEFINED;
				updatedBookmark = true;
			}
		}

		lineRange = [];
		for (let i = lineMin; i <= lineMax; i++) {
			lineRange.push(i);
		}
		lineRange = lineRange.sort();
		if (diffLine < 0) {
			lineRange = lineRange.reverse();
		}

		for (let i in lineRange) {
			let index = activeBookmark.bookmarks.indexOf(lineRange[i]);
			if (index > -1) {
				activeBookmark.bookmarks[index] -= diffLine;
				updatedBookmark = true;
			}
		}

		if (diffChange > -1) {
			activeBookmark.bookmarks.push(diffChange);
			updatedBookmark = true;
		}

		return updatedBookmark;
	}
    
    function removeRootPathFrom(path: string): string {
        if (!vscode.workspace.rootPath) {
            return path;
        }
        
        if (path.indexOf(vscode.workspace.rootPath) == 0) {
            return path.split(vscode.workspace.rootPath).pop();
        } else {
            return '$(file-directory) ' + path;
        }
    }
}


