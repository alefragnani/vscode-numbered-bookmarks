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

        resetBookmarks() {
            for (var index = 0; index < MAX_BOOKMARKS; index++) {
                this.bookmarks[index] = NO_BOOKMARK_DEFINED;
            }
        }
    }

    class Bookmarks {
        bookmarks: Bookmark[];

        constructor() {
            this.bookmarks = [];
        }

        public loadFrom(jsonObject) {
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
        }

        fromUri(uri: string) {
            for (var index = 0; index < this.bookmarks.length; index++) {
                var element = this.bookmarks[index];

                if (element.fsPath == uri) {
                    return element;
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
    }

    var bookmarks: Bookmarks;
	
    // load pre-saved bookmarks
    let didLoadBookmarks: boolean = loadWorkspaceState();


    let bookmarkDecorationType: vscode.TextEditorDecorationType[] = [];
    bookmarkDecorationType.length = MAX_BOOKMARKS;
    for (var index = 0; index < MAX_BOOKMARKS; index++) {
        let pathIcon: string = context.asAbsolutePath('images\\bookmark' + index + '.png');
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
        for (var index = 0; index < MAX_BOOKMARKS; index++) {
            books = [];
            if (activeBookmark.bookmarks[index] < 0) {
                activeEditor.setDecorations(getDecoration(index), books);
            } else {
                var element = activeBookmark.bookmarks[index];
                var decoration = new vscode.Range(element, 0, element, 0);
                books.push(decoration);
                activeEditor.setDecorations(getDecoration(index), books);
            }
        }
        }
    }
	
	
    // other commands
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
            if (element != -1) {
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

    function revealLine(line: number) {
        var newSe = new vscode.Selection(line, 0, line, 0);
        vscode.window.activeTextEditor.selection = newSe;
        vscode.window.activeTextEditor.revealRange(newSe, vscode.TextEditorRevealType.InCenter);
    }

    function loadWorkspaceState(): boolean {
        let saveBookmarksBetweenSessions: boolean = vscode.workspace.getConfiguration('numberedBookmarks').get('saveBookmarksBetweenSessions', false);
        bookmarks = new Bookmarks();

        let savedBookmarks = context.workspaceState.get('numberedBookmarks', '');
        if (savedBookmarks != '') {
            bookmarks.loadFrom(JSON.parse(savedBookmarks));
        }
        return savedBookmarks != '';
    }

    function saveWorkspaceState(): void {
        let saveBookmarksBetweenSessions: boolean = vscode.workspace.getConfiguration('numberedBookmarks').get('saveBookmarksBetweenSessions', false);
        if (!saveBookmarksBetweenSessions) {
            return;
        }

        context.workspaceState.update('numberedBookmarks', JSON.stringify(bookmarks));
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
            activeBookmark.bookmarks[n] = line;
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

        // is it already set?
        if (activeBookmark.bookmarks[n] < 0) {
            vscode.window.setStatusBarMessage('The Bookmark ' + n + ' is not defined', 3000);
            return;
        }				
		
        revealLine(activeBookmark.bookmarks[n]);
    }

    //............................................................................................

	// function used to attach bookmarks at the line
	function stickyBookmarks(event): boolean {
        
        let useStickyBookmarks: boolean = vscode.workspace.getConfiguration('numberedBookmarks').get('useStickyBookmarks', false);
        if (!useStickyBookmarks) {
            return false;
        }
        
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
}


