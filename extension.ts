// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import path = require('path');
import fs = require('fs');

// this method is called when vs code is activated
export function activate(context: vscode.ExtensionContext) {

    const MAX_BOOKMARKS = 10;
    const NO_BOOKMARK_DEFINED = -1;

    class Bookmark {
        fsPath: string;
        bookmarks: number[]; 

        constructor(uri: vscode.Uri) {
            this.fsPath = uri.fsPath;
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

        constructor(jsonObject) {
            this.bookmarks = [];

            if (jsonObject != '') {
                for (let prop in jsonObject) this[prop] = jsonObject[prop];
            }
        }

        fromUri(uri: vscode.Uri) {
            for (var index = 0; index < this.bookmarks.length; index++) {
                var element = this.bookmarks[index];

                if (element.fsPath == uri.fsPath) {
                    return element;
                }
            }
        }

        add(uri: vscode.Uri) {
            let existing: Bookmark = this.fromUri(uri);
            if (typeof existing == 'undefined') {
                var bookmark = new Bookmark(uri);
                this.bookmarks.push(bookmark);
            }
        }
    }

    console.log('Numbered Bookmarks is activated');

    var bookmarks: Bookmarks;
	
    // load pre-saved bookmarks
    let didLoadBookmarks: boolean = loadWorkspaceState();


    let bookmarkDecorationType: vscode.TextEditorDecorationType[] = [];
    bookmarkDecorationType.length = MAX_BOOKMARKS;
    for (var index = 0; index < MAX_BOOKMARKS; index++) {
        let pathIcon: string = context.asAbsolutePath('images\\bookmark' + index + '.png');
        bookmarkDecorationType[index] = vscode.window.createTextEditorDecorationType({
            gutterIconPath: pathIcon
        });
    }
    

    // Connect it to the Editors Events
    var activeEditor = vscode.window.activeTextEditor;
    var activeBookmark: Bookmark;

    if (activeEditor) {
        if (!didLoadBookmarks) {
            bookmarks.add(activeEditor.document.uri);
        }
        activeBookmark = bookmarks.fromUri(activeEditor.document.uri);
        triggerUpdateDecorations();
    }
	
    // new docs
    vscode.workspace.onDidOpenTextDocument(doc => {
        bookmarks.add(doc.uri);
    });

    vscode.window.onDidChangeActiveTextEditor(editor => {
        activeEditor = editor;
        if (editor) {
            activeBookmark = bookmarks.fromUri(editor.document.uri);
            triggerUpdateDecorations();
        }
    }, null, context.subscriptions);

    vscode.workspace.onDidChangeTextDocument(event => {
        if (activeEditor && event.document === activeEditor.document) {
            triggerUpdateDecorations();
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
            activeBookmark.bookmarks[index] = NO_BOOKMARK_DEFINED;
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
        if (!saveBookmarksBetweenSessions) {
            bookmarks = new Bookmarks('');
            return false;
        }

        let savedBookmarks = context.workspaceState.get('numberedBookmarks', '');
        if (savedBookmarks != '') {
            bookmarks = new Bookmarks(JSON.parse(savedBookmarks));
        } else {
            bookmarks = new Bookmarks('');
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
            bookmarks.add(vscode.window.activeTextEditor.document.uri);
            activeBookmark = bookmarks.fromUri(vscode.window.activeTextEditor.document.uri);
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
}


