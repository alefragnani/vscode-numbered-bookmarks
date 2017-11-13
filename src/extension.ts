// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import path = require("path");
import fs = require("fs");

import { Bookmark, MAX_BOOKMARKS, NO_BOOKMARK_DEFINED } from "./Bookmark";
import { Bookmarks } from "./Bookmarks";
import { Sticky } from "./Sticky";

// this method is called when vs code is activated
export function activate(context: vscode.ExtensionContext) {

    let bookmarks: Bookmarks;
    let activeEditorCountLine: number;
    let timeout = null;

    // load pre-saved bookmarks
    let didLoadBookmarks: boolean = loadWorkspaceState();

    let bookmarkDecorationType: vscode.TextEditorDecorationType[] = [];
    bookmarkDecorationType.length = MAX_BOOKMARKS;
    for (let index = 0; index < MAX_BOOKMARKS; index++) {
        let pathIcon: string = context.asAbsolutePath("images\\bookmark" + index + ".png");
        pathIcon = pathIcon.replace(/\\/g, "/");
        bookmarkDecorationType[ index ] = vscode.window.createTextEditorDecorationType({
            gutterIconPath: pathIcon,
            overviewRulerLane: vscode.OverviewRulerLane.Full,
            overviewRulerColor: "rgba(1, 255, 33, 0.7)"
        });
    }

    // Connect it to the Editors Events
    let activeEditor = vscode.window.activeTextEditor;
    let activeBookmark: Bookmark;

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
        // activeEditorCountLine = doc.lineCount;
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
            let updatedBookmark: boolean = true;
            // call sticky function when the activeEditor is changed
            if (activeBookmark && activeBookmark.bookmarks.length > 0) {
                // updatedBookmark = stickyBookmarks(event);
                updatedBookmark = Sticky.stickyBookmarks(event, activeEditorCountLine, 
                    activeBookmark, activeEditor);
            }

            activeEditorCountLine = event.document.lineCount;
            updateDecorations();

            if (updatedBookmark) {
                saveWorkspaceState();
            }
        }
    }, null, context.subscriptions);

    // Timeout
    function triggerUpdateDecorations() {
        if (timeout) {
            clearTimeout(timeout);
        }
        timeout = setTimeout(updateDecorations, 100);
    }

    function getDecoration(n: number): vscode.TextEditorDecorationType {
        return bookmarkDecorationType[ n ];
    }

    // Evaluate (prepare the list) and DRAW
    function updateDecorations() {
        if (!activeEditor) {
            return;
        }

        if (!activeBookmark) {
            return;
        }

        let books: vscode.Range[] = [];
        // Remove all bookmarks if active file is empty
        if (activeEditor.document.lineCount === 1 && activeEditor.document.lineAt(0).text === "") {
            activeBookmark.bookmarks = [];
        } else {
            let invalids = [];
            for (let index = 0; index < MAX_BOOKMARKS; index++) {
                books = [];
                if (activeBookmark.bookmarks[ index ] < 0) {
                    activeEditor.setDecorations(getDecoration(index), books);
                } else {
                    let element = activeBookmark.bookmarks[ index ];
                    if (element < activeEditor.document.lineCount) {
                        let decoration = new vscode.Range(element, 0, element, 0);
                        books.push(decoration);
                        activeEditor.setDecorations(getDecoration(index), books);
                    } else {
                        invalids.push(index);
                    }
                }
            }

            if (invalids.length > 0) {
                // tslint:disable-next-line:prefer-for-of
                for (let indexI = 0; indexI < invalids.length; indexI++) {
                    activeBookmark.bookmarks[ invalids[ indexI ] ] = NO_BOOKMARK_DEFINED;
                }
            }
        }
    }

    // other commands
    vscode.commands.registerCommand("numberedBookmarks.toggleBookmark0", () => {
        toggleBookmark(0, vscode.window.activeTextEditor.selection.active.line);
    });

    vscode.commands.registerCommand("numberedBookmarks.toggleBookmark1", () => {
        toggleBookmark(1, vscode.window.activeTextEditor.selection.active.line);
    });

    vscode.commands.registerCommand("numberedBookmarks.toggleBookmark2", () => {
        toggleBookmark(2, vscode.window.activeTextEditor.selection.active.line);
    });

    vscode.commands.registerCommand("numberedBookmarks.toggleBookmark3", () => {
        toggleBookmark(3, vscode.window.activeTextEditor.selection.active.line);
    });

    vscode.commands.registerCommand("numberedBookmarks.toggleBookmark4", () => {
        toggleBookmark(4, vscode.window.activeTextEditor.selection.active.line);
    });

    vscode.commands.registerCommand("numberedBookmarks.toggleBookmark5", () => {
        toggleBookmark(5, vscode.window.activeTextEditor.selection.active.line);
    });

    vscode.commands.registerCommand("numberedBookmarks.toggleBookmark6", () => {
        toggleBookmark(6, vscode.window.activeTextEditor.selection.active.line);
    });

    vscode.commands.registerCommand("numberedBookmarks.toggleBookmark7", () => {
        toggleBookmark(7, vscode.window.activeTextEditor.selection.active.line);
    });

    vscode.commands.registerCommand("numberedBookmarks.toggleBookmark8", () => {
        toggleBookmark(8, vscode.window.activeTextEditor.selection.active.line);
    });

    vscode.commands.registerCommand("numberedBookmarks.toggleBookmark9", () => {
        toggleBookmark(9, vscode.window.activeTextEditor.selection.active.line);
    });

    vscode.commands.registerCommand("numberedBookmarks.jumpToBookmark0", () => {
        jumpToBookmark(0);
    });

    vscode.commands.registerCommand("numberedBookmarks.jumpToBookmark1", () => {
        jumpToBookmark(1);
    });

    vscode.commands.registerCommand("numberedBookmarks.jumpToBookmark2", () => {
        jumpToBookmark(2);
    });

    vscode.commands.registerCommand("numberedBookmarks.jumpToBookmark3", () => {
        jumpToBookmark(3);
    });

    vscode.commands.registerCommand("numberedBookmarks.jumpToBookmark4", () => {
        jumpToBookmark(4);
    });

    vscode.commands.registerCommand("numberedBookmarks.jumpToBookmark5", () => {
        jumpToBookmark(5);
    });

    vscode.commands.registerCommand("numberedBookmarks.jumpToBookmark6", () => {
        jumpToBookmark(6);
    });

    vscode.commands.registerCommand("numberedBookmarks.jumpToBookmark7", () => {
        jumpToBookmark(7);
    });

    vscode.commands.registerCommand("numberedBookmarks.jumpToBookmark8", () => {
        jumpToBookmark(8);
    });

    vscode.commands.registerCommand("numberedBookmarks.jumpToBookmark9", () => {
        jumpToBookmark(9);
    });

    vscode.commands.registerCommand("numberedBookmarks.clear", () => {
        for (let index = 0; index < MAX_BOOKMARKS; index++) {
            activeBookmark.clear();
        }

        saveWorkspaceState();
        updateDecorations();
    });

    vscode.commands.registerCommand("numberedBookmarks.clearFromAllFiles", () => {

        // for (let index = 0; index < bookmarks.bookmarks.length; index++) {
        //     let element = bookmarks.bookmarks[ index ];
        for (let element of bookmarks.bookmarks) {
            element.clear();
        }

        saveWorkspaceState();
        updateDecorations();
    });

    vscode.commands.registerCommand("numberedBookmarks.list", () => {
        // no bookmark
        if (activeBookmark.bookmarks.length === 0) {
            vscode.window.showInformationMessage("No Bookmark found");
            return;
        }

        // push the items
        let items: vscode.QuickPickItem[] = [];
        // for (let index = 0; index < activeBookmark.bookmarks.length; index++) {
        //     let element = activeBookmark.bookmarks[ index ];
        for (let element of activeBookmark.bookmarks) {
            // > -> temporary fix for modified files
            if ((element !== -1) && (element <= vscode.window.activeTextEditor.document.lineCount)) {
                let lineText = vscode.window.activeTextEditor.document.lineAt(element).text;
                element++;
                items.push({ label: element.toString(), description: lineText });
            }
        }

        // pick one
        let currentLine: number = vscode.window.activeTextEditor.selection.active.line + 1;
        let options = <vscode.QuickPickOptions> {
            placeHolder: "Type a line number or a piece of code to navigate to",
            matchOnDescription: true,
            matchOnDetail: true,
            onDidSelectItem: item => {
                let itemT = <vscode.QuickPickItem> item;
                revealLine(parseInt(itemT.label, 10) - 1);
            }
        };

        vscode.window.showQuickPick(items, options).then(selection => {
            if (typeof selection === "undefined") {
                revealLine(currentLine - 1);
                return;
            }
            revealLine(parseInt(selection.label, 10) - 1);
        });
    });

    vscode.commands.registerCommand("numberedBookmarks.listFromAllFiles", () => {

        // no bookmark
        let totalBookmarkCount: number = 0;
        // tslint:disable-next-line:prefer-for-of
        for (let index = 0; index < bookmarks.bookmarks.length; index++) {
            totalBookmarkCount = totalBookmarkCount + bookmarks.bookmarks[ index ].bookmarks.length;
        }
        if (totalBookmarkCount === 0) {
            vscode.window.showInformationMessage("No Bookmarks found");
            return;
        }

        // push the items
        let items: vscode.QuickPickItem[] = [];
        let activeTextEditorPath = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.document.uri.fsPath : "";
        let promisses = [];
        let currentLine: number = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.selection.active.line + 1 : -1;

        let currentWorkspaceFolder: vscode.WorkspaceFolder; 
        if (activeTextEditorPath) {
            currentWorkspaceFolder = vscode.workspace.getWorkspaceFolder(vscode.Uri.file(activeTextEditorPath));
        }            
        
        // tslint:disable-next-line:prefer-for-of
        for (let index = 0; index < bookmarks.bookmarks.length; index++) {
            let bookmark = bookmarks.bookmarks[ index ];

            let pp = bookmark.listBookmarks();
            promisses.push(pp);
        }

        Promise.all(promisses).then(
            (values) => {
                // tslint:disable-next-line:prefer-for-of
                for (let index = 0; index < values.length; index++) {
                    let element = values[ index ];
                    // tslint:disable-next-line:prefer-for-of
                    for (let indexInside = 0; indexInside < element.length; indexInside++) {
                        let elementInside = element[ indexInside ];

                        if (elementInside.detail.toString().toLowerCase() === activeTextEditorPath.toLowerCase()) {
                            items.push(
                                {
                                    label: elementInside.label,
                                    description: elementInside.description
                                }
                            );
                        } else {
                            let itemPath = removeBasePathFrom(elementInside.detail, currentWorkspaceFolder);
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
                    }

                    if (!a.detail && b.detail) {
                        return -1;
                    }
                    
                    if (a.detail && !b.detail) {
                            return 1;
                    }

                    if ((a.detail.toString().indexOf("$(file-submodule) ") === 0) && (b.detail.toString().indexOf("$(file-directory) ") === 0)) {
                        return -1;
                    };
                    
                    if ((a.detail.toString().indexOf("$(file-directory) ") === 0) && (b.detail.toString().indexOf("$(file-submodule) ") === 0)) {
                        return 1;
                    };

                    if ((a.detail.toString().indexOf("$(file-submodule) ") === 0) && (b.detail.toString().indexOf("$(file-submodule) ") === -1)) {
                        return 1;
                    };
                    
                    if ((a.detail.toString().indexOf("$(file-submodule) ") === -1) && (b.detail.toString().indexOf("$(file-submodule) ") === 0)) {
                        return -1;
                    };
                    
                    if ((a.detail.toString().indexOf("$(file-directory) ") === 0) && (b.detail.toString().indexOf("$(file-directory) ") === -1)) {
                        return 1;
                    }
                    
                    if ((a.detail.toString().indexOf("$(file-directory) ") === -1) && (b.detail.toString().indexOf("$(file-directory) ") === 0)) {
                        return -1;
                    }
                    
                    return 0;
                });

                let options = <vscode.QuickPickOptions> {
                    placeHolder: "Type a line number or a piece of code to navigate to",
                    matchOnDescription: true,
                    onDidSelectItem: item => {

                        let itemT = <vscode.QuickPickItem>item

                        let filePath: string;
                        // no detail - previously active document
                        if (!itemT.detail) {
                            filePath = activeTextEditorPath;
                        } else {
                            // with octicon - document outside project
                            if (itemT.detail.toString().indexOf("$(file-directory) ") === 0) {
                                filePath = itemT.detail.toString().split("$(file-directory) ").pop();
                            } else { // with octicon - documento from other workspaceFolder
                                if (itemT.detail.toString().indexOf("$(file-submodule)") === 0) {
                                    filePath = itemT.detail.toString().split("$(file-submodule) ").pop();
                                    for (const wf of vscode.workspace.workspaceFolders) {
                                        if (wf.name === filePath.split(path.sep).shift()) {
                                            filePath = path.join(wf.uri.fsPath, filePath.split(path.sep).slice(1).join(path.sep));
                                            break;
                                        }
                                    }
                                    
                                } else { // no octicon - document inside project
                                    if (currentWorkspaceFolder) {
                                        filePath = currentWorkspaceFolder.uri.fsPath + itemT.detail.toString();
                                    } else {
                                        if (vscode.workspace.workspaceFolders) {
                                            filePath = vscode.workspace.workspaceFolders[0].uri.fsPath + itemT.detail.toString();
                                        } else {
                                            filePath = itemT.detail.toString();
                                        }
                                    }
                                }
                            }
                        }

                        if (vscode.window.activeTextEditor && vscode.window.activeTextEditor.document.uri.fsPath.toLowerCase() === filePath.toLowerCase()) {
                            revealLine(parseInt(itemT.label, 10) - 1);
                        } else {
                            let uriDocument: vscode.Uri = vscode.Uri.file(filePath);
                            vscode.workspace.openTextDocument(uriDocument).then(doc => {
                                // vscode.window.showTextDocument(doc, undefined, true).then(editor => {
                                vscode.window.showTextDocument(doc, {preserveFocus: true, preview: true}).then(editor => {
                                    revealLine(parseInt(itemT.label, 10) - 1);
                                });
                            });
                        }
                    }
                };
                vscode.window.showQuickPick(itemsSorted, options).then(selection => {
                    if (typeof selection === "undefined") {
                        if (activeTextEditorPath === "") {
                            vscode.commands.executeCommand("workbench.action.closeActiveEditor");
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

                    if (typeof selection === "undefined") {
                        return;
                    }

                    if (!selection.detail) {
                        revealLine(parseInt(selection.label, 10) - 1);
                    } else {    
                        let newPath: string;
                        // with octicon - document outside project
                        if (selection.detail.toString().indexOf("$(file-directory) ") === 0) {
                            newPath = selection.detail.toString().split("$(file-directory) ").pop();
                        } else {// no octicon - document inside project
                            if (selection.detail.toString().indexOf("$(file-submodule)") === 0) {
                                newPath = selection.detail.toString().split("$(file-submodule) ").pop();
                                for (const wf of vscode.workspace.workspaceFolders) {
                                    if (wf.name === newPath.split(path.sep).shift()) {
                                        newPath = path.join(wf.uri.fsPath, newPath.split(path.sep).slice(1).join(path.sep));
                                        break;
                                    }
                                }                            
                            } else { // no octicon - document inside project
                                if (currentWorkspaceFolder) {
                                    newPath = currentWorkspaceFolder.uri.fsPath + selection.detail.toString();
                                } else {
                                    if (vscode.workspace.workspaceFolders) {
                                        newPath = vscode.workspace.workspaceFolders[0].uri.fsPath + selection.detail.toString();
                                    } else {
                                        newPath = selection.detail.toString();
                                    }
                                }
                            }
                        }
                        let uriDocument: vscode.Uri = vscode.Uri.file(newPath);
                        vscode.workspace.openTextDocument(uriDocument).then(doc => {
                            vscode.window.showTextDocument(doc).then(editor => {
                                revealLine(parseInt(selection.label, 10) - 1);
                            });
                        });
                    }
                });
            }
        );
    });

    function revealLine(line: number, directJump?: boolean) {
        let newSe = new vscode.Selection(line, 0, line, 0);
        vscode.window.activeTextEditor.selection = newSe;
        if (directJump) {
            vscode.window.activeTextEditor.revealRange(newSe, vscode.TextEditorRevealType.InCenterIfOutsideViewport);
        } else {
            vscode.window.activeTextEditor.revealRange(newSe, vscode.TextEditorRevealType.InCenter);
        }
    }

    function canSaveBookmarksInProject(): boolean {
        let saveBookmarksInProject: boolean = vscode.workspace.getConfiguration("numberedBookmarks").get("saveBookmarksInProject", false);
        
        // really use saveBookmarksInProject
        // 1. is a valid workspace/folder
        // 2. has only one workspaceFolder
        // let hasBookmarksFile: boolean = false;
        if (saveBookmarksInProject && vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 1) {
            // hasBookmarksFile = fs.existsSync(path.join(vscode.workspace.workspaceFolders[0].uri.fsPath, ".vscode", "bookmarks.json"));
            saveBookmarksInProject = false;
        }

        return saveBookmarksInProject;
    }

    function loadWorkspaceState(): boolean {
        let saveBookmarksInProject: boolean = canSaveBookmarksInProject();

        bookmarks = new Bookmarks();

        if (saveBookmarksInProject) {
            let bookmarksFileInProject: string = path.join(vscode.workspace.workspaceFolders[0].uri.fsPath, ".vscode", "numbered-bookmarks.json");
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
        // return;
        let saveBookmarksInProject: boolean = canSaveBookmarksInProject();

        if (vscode.workspace.rootPath && saveBookmarksInProject) {
            let bookmarksFileInProject: string = path.join(vscode.workspace.workspaceFolders[0].uri.fsPath, ".vscode", "numbered-bookmarks.json");
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
        if (index !== n) {
            activeBookmark.bookmarks[ n ] = line;

            // when _toggling_ only "replace" differs, because it has to _invalidate_ that bookmark from other files 
            let navigateThroughAllFiles: string = vscode.workspace.getConfiguration("numberedBookmarks").get("navigateThroughAllFiles", "false");
            if (navigateThroughAllFiles === "replace") {
                // for (let index = 0; index < bookmarks.bookmarks.length; index++) {
                //     let element = bookmarks.bookmarks[ index ];
                for (let element of bookmarks.bookmarks) {
                    if (element.fsPath !== activeBookmark.fsPath) {
                        element.bookmarks[ n ] = NO_BOOKMARK_DEFINED;
                    }
                }
            }
        }

        saveWorkspaceState();
        updateDecorations();
    }

    function clearBookmark(n: number) {
        activeBookmark.bookmarks[ n ] = NO_BOOKMARK_DEFINED;
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
                if (activeBookmark.bookmarks[ n ] < 0) {

                    // no, look for another document that contains that bookmark 
                    // I can start from the first because _there is only one_
                    // for (let index = 0; index < bookmarks.bookmarks.length; index++) {
                    //     let element = bookmarks.bookmarks[ index ];
                    for (let element of bookmarks.bookmarks) {
                        if ((element.fsPath !== activeBookmark.fsPath) && (element.bookmarks[ n ] !== NO_BOOKMARK_DEFINED)) {
                            // open and novigate
                            let uriDocument: vscode.Uri = vscode.Uri.file(element.fsPath);
                            vscode.workspace.openTextDocument(uriDocument).then(doc => {
                                vscode.window.showTextDocument(doc, undefined, false).then(editor => {
                                    revealLine(element.bookmarks[ n ]);
                                });
                            });
                        }
                    }
                } else {
                    revealLine(activeBookmark.bookmarks[ n ], true);
                }

                break;

            case "allowDuplicates":

                // this file has, and I'm not in the line
                if ((activeBookmark.bookmarks[ n ] > NO_BOOKMARK_DEFINED) &&
                    (activeBookmark.bookmarks[ n ] !== vscode.window.activeTextEditor.selection.active.line)) {
                    revealLine(activeBookmark.bookmarks[ n ], true);
                    break;
                }

                // no, look for another document that contains that bookmark 
                // I CAN'T start from the first because _there can be duplicates_
                let currentFile: number = bookmarks.indexFromUri(activeBookmark.fsPath);
                let found: boolean = false;

                // to the end
                for (let index = currentFile; index < bookmarks.bookmarks.length; index++) {
                    let element = bookmarks.bookmarks[ index ];
                    if ((!found) && (element.fsPath !== activeBookmark.fsPath) && (element.bookmarks[ n ] !== NO_BOOKMARK_DEFINED)) {
                        found = true;
                        // open and novigate
                        let uriDocument: vscode.Uri = vscode.Uri.file(element.fsPath);
                        vscode.workspace.openTextDocument(uriDocument).then(doc => {
                            vscode.window.showTextDocument(doc, undefined, false).then(editor => {
                                revealLine(element.bookmarks[ n ]);
                            });
                        });
                    }
                }

                if (!found) {
                    for (let index = 0; index < currentFile; index++) {
                        let element = bookmarks.bookmarks[ index ];
                        if ((!found) && (element.fsPath !== activeBookmark.fsPath) && (element.bookmarks[ n ] !== NO_BOOKMARK_DEFINED)) {
                            // open and novigate
                            found = true;
                            let uriDocument: vscode.Uri = vscode.Uri.file(element.fsPath);
                            vscode.workspace.openTextDocument(uriDocument).then(doc => {
                                vscode.window.showTextDocument(doc, undefined, false).then(editor => {
                                    revealLine(element.bookmarks[ n ]);
                                });
                            });
                        }
                    }
                }

                break;

            default: // "false"
                // is it already set?
                if (activeBookmark.bookmarks[ n ] < 0) {
                    vscode.window.setStatusBarMessage("The Bookmark " + n + " is not defined", 3000);
                    return;
                }
                revealLine(activeBookmark.bookmarks[ n ], true);

                break;
        }
    }

    function removeBasePathFrom(aPath: string, currentWorkspaceFolder: vscode.WorkspaceFolder): string {
        if (!vscode.workspace.workspaceFolders) {
            return aPath;
        }

        let inWorkspace: vscode.WorkspaceFolder;
        for (const wf of vscode.workspace.workspaceFolders) {
            if (aPath.indexOf(wf.uri.fsPath) === 0) {
                inWorkspace = wf;
            }
        }

        if (inWorkspace) {
            if (inWorkspace === currentWorkspaceFolder) {
                return aPath.split(inWorkspace.uri.fsPath).pop();
            } else {
                if (!currentWorkspaceFolder && vscode.workspace.workspaceFolders.length === 1) {
                    return aPath.split(inWorkspace.uri.fsPath).pop();
                } else {
                    return "$(file-submodule) " + inWorkspace.name + /*path.sep + */aPath.split(inWorkspace.uri.fsPath).pop();
                }
            }
            // const base: string = inWorkspace.name ? inWorkspace.name : inWorkspace.uri.fsPath;
            // return path.join(base, aPath.split(inWorkspace.uri.fsPath).pop());
            // return aPath.split(inWorkspace.uri.fsPath).pop();
        } else {
            return "$(file-directory) " + aPath;
        }
    }
}