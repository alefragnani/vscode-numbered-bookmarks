/*---------------------------------------------------------------------------------------------
*  Copyright (c) Alessandro Fragnani. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import * as vscode from "vscode";
import { Uri } from "vscode";

import { Bookmark, BookmarkQuickPickItem } from "../vscode-numbered-bookmarks-core/src/bookmark";
import { NO_BOOKMARK_DEFINED } from "../vscode-numbered-bookmarks-core/src/constants";
import { Controller } from "../vscode-numbered-bookmarks-core/src/controller";
import { clearBookmarks, hasBookmarks, indexOfBookmark, isBookmarkDefined, listBookmarks } from "../vscode-numbered-bookmarks-core/src/operations";
import { revealLine, revealPosition, previewPositionInDocument, revealPositionInDocument } from "../vscode-numbered-bookmarks-core/src/utils/reveal";
import { Sticky } from "../vscode-numbered-bookmarks-core/src/sticky";
import { loadBookmarks, saveBookmarks } from "../vscode-numbered-bookmarks-core/src/workspaceState";
import { Container } from "../vscode-numbered-bookmarks-core/src/container";
import { registerWhatsNew } from "./whats-new/commands";
import { codicons } from "vscode-ext-codicons";
import { getRelativePath, parsePosition } from "../vscode-numbered-bookmarks-core/src/utils/fs";
import { File } from "../vscode-numbered-bookmarks-core/src/file";
import { updateBookmarkDecorationType, updateBookmarkSvg, updateDecorationsInActiveEditor, updateSvgVersion } from "./decoration";

export async function activate(context: vscode.ExtensionContext) {

    Container.context = context;

    registerWhatsNew();

    let controller: Controller;
    // let activeController: Controller;
    // let controllers: Controller[] = [];
    let activeEditorCountLine: number;
    let timeout = null;    
    let activeEditor = vscode.window.activeTextEditor;
    let activeBookmark: File;            
    const bookmarkDecorationType: vscode.TextEditorDecorationType[] = [];

    // load pre-saved bookmarks
    // let didLoadBookmarks: boolean;
    if (vscode.workspace.workspaceFolders) {
        controller = await loadWorkspaceState(vscode.workspace.workspaceFolders[0]); // activeEditor.document.uri);
    } else {
        controller = await loadWorkspaceState(undefined);
    }

    // if (vscode.workspace.workspaceFolders) {
    //     controllers = await Promise.all(
    //         vscode.workspace.workspaceFolders!.map(async workspaceFolder => {
    //             const ctrl = loadBookmarks(workspaceFolder);

    //             return ctrl;
    //         })
    //     );
            
    //     console.log(controllers.length);
    // }
    
    updateBookmarkSvg(triggerUpdateDecorations);
    updateBookmarkDecorationType(bookmarkDecorationType);

    // Connect it to the Editors Events
    if (activeEditor) {
        controller.addFile(activeEditor.document.uri);
        activeEditorCountLine = activeEditor.document.lineCount;
        activeBookmark = controller.fromUri(activeEditor.document.uri);
        triggerUpdateDecorations();
    }

    // new docs
    vscode.workspace.onDidOpenTextDocument(doc => {
        // activeEditorCountLine = doc.lineCount;
        controller.addFile(doc.uri);
    });

    vscode.window.onDidChangeActiveTextEditor(editor => {
        activeEditor = editor;
        if (editor) {
            activeEditorCountLine = editor.document.lineCount;
            activeBookmark = controller.fromUri(editor.document.uri);
            
            // activeController = controllers.find(ctrl => 
            //        ctrl.workspaceFolder.uri.path === vscode.workspace.getWorkspaceFolder(editor.document.uri).uri.path)

            triggerUpdateDecorations();
        }
    }, null, context.subscriptions);

    vscode.workspace.onDidChangeTextDocument(event => {
        if (activeEditor && event.document === activeEditor.document) {
            let updatedBookmark = true;
            // call sticky function when the activeEditor is changed
            if (activeBookmark && activeBookmark.bookmarks.length > 0) {
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
    
    vscode.workspace.onDidChangeConfiguration(event => {    
        if (event.affectsConfiguration("numberedBookmarks.gutterIconFillColor") 
            || event.affectsConfiguration("numberedBookmarks.gutterIconNumberColor")    
        ) {
            updateSvgVersion();
            updateBookmarkSvg(triggerUpdateDecorations);  
            updateBookmarkDecorationType(bookmarkDecorationType);      
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
        updateDecorationsInActiveEditor(activeEditor, activeBookmark, getDecoration);
    }
    
    // other commands
    for (let i = 0; i <= 9; i++) {
        vscode.commands.registerCommand(
            `numberedBookmarks.toggleBookmark${i}`, 
            () => toggleBookmark(i, vscode.window.activeTextEditor.selection.active)
        );
        vscode.commands.registerCommand(
            `numberedBookmarks.jumpToBookmark${i}`,
            () => jumpToBookmark(i)
        );
    }

    vscode.commands.registerCommand("numberedBookmarks.clear", () => {
        clearBookmarks(activeBookmark);
        
        saveWorkspaceState();
        updateDecorations();
    });

    vscode.commands.registerCommand("numberedBookmarks.clearFromAllFiles", () => {
        for (const file of controller.files) {
            clearBookmarks(file);
        }

        saveWorkspaceState();
        updateDecorations();
    });

    vscode.commands.registerCommand("numberedBookmarks.list", () => {
        // no bookmark
        if (!hasBookmarks(activeBookmark)) {
            vscode.window.showInformationMessage("No Bookmarks found");
            return;
        }

        // push the items
        const items: vscode.QuickPickItem[] = [];
        for (const bookmark of activeBookmark.bookmarks) {
            if (isBookmarkDefined(bookmark)) {
                const bookmarkLine = bookmark.line + 1;
                const bookmarkColumn = bookmark.column + 1;
                const lineText = vscode.window.activeTextEditor.document.lineAt(bookmarkLine - 1).text.trim();
                items.push({
                    label: lineText,
                    description: "(Ln " + bookmarkLine.toString() + ", Col " +
                        bookmarkColumn.toString() + ")"
                });
            }
        }

        // pick one
        const currentLine: number = vscode.window.activeTextEditor.selection.active.line + 1;
        const options = <vscode.QuickPickOptions> {
            placeHolder: "Type a line number or a piece of code to navigate to",
            matchOnDescription: true,
            matchOnDetail: true,
            onDidSelectItem: item => {
                const itemT = <vscode.QuickPickItem> item;
                const point: Bookmark = parsePosition(itemT.description);
                if (point) {
                    revealPosition(point.line - 1, point.column - 1);
                }
            }
        };

        vscode.window.showQuickPick(items, options).then(selection => {
            if (typeof selection === "undefined") {
                revealLine(currentLine - 1);
                return;
            }
            const itemT = <vscode.QuickPickItem> selection;
            const point: Bookmark = parsePosition(itemT.description);
            if (point) {
                revealPosition(point.line - 1, point.column - 1);
            }
        });
    });

    vscode.commands.registerCommand("numberedBookmarks.listFromAllFiles", () => {
        // no bookmark
        let someFileHasBookmark: boolean;
        for (const file of controller.files) {
            someFileHasBookmark = someFileHasBookmark || hasBookmarks(file);
            if (someFileHasBookmark) break;
        }
        if (!someFileHasBookmark) {
            vscode.window.showInformationMessage("No Bookmarks found");
            return;
        }

        // push the items
        const items: BookmarkQuickPickItem[] = [];
        const activeTextEditor = vscode.window.activeTextEditor;
        const promisses = [];
        const currentLine: number = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.selection.active.line + 1 : -1;

        // tslint:disable-next-line:prefer-for-of
        for (let index = 0; index < controller.files.length; index++) {
            const file = controller.files[ index ];
            const pp = listBookmarks(file, controller.workspaceFolder);
            promisses.push(pp);
        }

        Promise.all(promisses).then(
            (values) => {
                // tslint:disable-next-line:prefer-for-of
                for (let index = 0; index < values.length; index++) {
                    const element = values[ index ];
                    // tslint:disable-next-line:prefer-for-of
                    for (let indexInside = 0; indexInside < element.length; indexInside++) {
                        const elementInside = element[ indexInside ];

                        if (elementInside.detail.toString().toLowerCase() === getRelativePath(controller.workspaceFolder.uri.path, activeTextEditor.document.uri.path)) {
                            items.push(
                                {
                                    label: elementInside.label,
                                    description: elementInside.description,
                                    uri: elementInside.uri
                                }
                            );
                        } else {
                            items.push(
                                {
                                    label: elementInside.label,
                                    description: elementInside.description,
                                    detail: elementInside.detail,
                                    uri: elementInside.uri
                                }
                            );
                        }
                    }

                }

                // sort
                // - active document
                // - no octicon - document inside project
                // - with octicon - document outside project
                const itemsSorted: BookmarkQuickPickItem[] = items.sort(function(a: BookmarkQuickPickItem, b: BookmarkQuickPickItem): number {
                    if (!a.detail && !b.detail) {
                        return 0;
                    }

                    if (!a.detail && b.detail) {
                        return -1;
                    }
                    
                    if (a.detail && !b.detail) {
                            return 1;
                    }

                    if ((a.detail.toString().indexOf(codicons.file_submodule + " ") === 0) && (b.detail.toString().indexOf(codicons.file_directory + " ") === 0)) {
                        return -1;
                    }
                    
                    if ((a.detail.toString().indexOf(codicons.file_directory + " ") === 0) && (b.detail.toString().indexOf(codicons.file_submodule + " ") === 0)) {
                        return 1;
                    }

                    if ((a.detail.toString().indexOf(codicons.file_submodule + " ") === 0) && (b.detail.toString().indexOf(codicons.file_submodule + " ") === -1)) {
                        return 1;
                    }
                    
                    if ((a.detail.toString().indexOf(codicons.file_submodule + " ") === -1) && (b.detail.toString().indexOf(codicons.file_submodule + " ") === 0)) {
                        return -1;
                    }
                    
                    if ((a.detail.toString().indexOf(codicons.file_directory + " ") === 0) && (b.detail.toString().indexOf(codicons.file_directory + " ") === -1)) {
                        return 1;
                    }
                    
                    if ((a.detail.toString().indexOf(codicons.file_directory + " ") === -1) && (b.detail.toString().indexOf(codicons.file_directory + " ") === 0)) {
                        return -1;
                    }
                    
                    return 0;
                });

                const options = <vscode.QuickPickOptions> {
                    placeHolder: "Type a line number or a piece of code to navigate to",
                    matchOnDescription: true,
                    onDidSelectItem: item => {

                        const itemT = <BookmarkQuickPickItem> item

                        let fileUri: Uri;
                        if (!itemT.detail) {
                            fileUri = activeTextEditor.document.uri;
                        } else {
                            fileUri = itemT.uri;
                        }

                        const point: Bookmark = parsePosition(itemT.description);
                        if (vscode.window.activeTextEditor && vscode.window.activeTextEditor.document.uri.fsPath.toLowerCase() === fileUri.fsPath.toLowerCase()) {
                            revealPosition(point.line - 1, point.column - 1);
                        } else {
                            previewPositionInDocument(point, fileUri);
                        }
                    }
                };
                vscode.window.showQuickPick(itemsSorted, options).then(async selection => {
                    if (typeof selection === "undefined") {
                        if (!activeTextEditor) {
                            vscode.commands.executeCommand("workbench.action.closeActiveEditor");
                            return;
                        } else {
                            vscode.workspace.openTextDocument(activeTextEditor.document.uri).then(doc => {
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

                    const point: Bookmark = parsePosition(selection.description);
                    if (!selection.detail) {
                        if (point) {
                            revealPosition(point.line - 1, point.column - 1);
                        }
                    }
                });
            }
        );
    });

    async function loadWorkspaceState(workspaceFolder: vscode.WorkspaceFolder): Promise<Controller> {
        return loadBookmarks(workspaceFolder);
    }

    function saveWorkspaceState(): void {
        saveBookmarks(controller);
    }

    function toggleBookmark(n: number, position: vscode.Position) {
        // fix issue emptyAtLaunch
        if (!activeBookmark) {
            controller.addFile(vscode.window.activeTextEditor.document.uri); 
            activeBookmark = controller.fromUri(vscode.window.activeTextEditor.document.uri);
        }

        // there is another bookmark already set for this line?
        const index: number = indexOfBookmark(activeBookmark, position.line);
        if (index >= 0) {
            clearBookmark(index);
        }

        // if was myself, then I want to 'remove'
        if (index !== n) {
            activeBookmark.bookmarks[ n ] = {
                line: position.line,
                column: position.character
            }

            // when _toggling_ only "replace" differs, because it has to _invalidate_ that bookmark from other files 
            const navigateThroughAllFiles: string = vscode.workspace.getConfiguration("numberedBookmarks").get("navigateThroughAllFiles", "false");
            if (navigateThroughAllFiles === "replace") {
                for (const element of controller.files) {
                    if (element.path !== activeBookmark.path) {
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

    async function jumpToBookmark(n: number) {
        if (!activeBookmark) {
            return;
        }

        // when _jumping_ each config has its own behavior 
        const navigateThroughAllFiles: string = vscode.workspace.getConfiguration("numberedBookmarks").get("navigateThroughAllFiles", "false");
        switch (navigateThroughAllFiles) {
            case "replace":
                // is it already set?
                if (activeBookmark.bookmarks[ n ].line < 0) {

                    // no, look for another document that contains that bookmark 
                    // I can start from the first because _there is only one_
                    for (const element of controller.files) {
                        if ((element.path !== activeBookmark.path) && (isBookmarkDefined(element.bookmarks[ n ]))) {
                            await revealPositionInDocument(element.bookmarks[n], controller.getFileUri(element));
                            return;
                        }
                    }
                } else {
                    revealPosition(activeBookmark.bookmarks[ n ].line, activeBookmark.bookmarks[ n ].column);
                }

                break;

            case "allowDuplicates": {

                // this file has, and I'm not in the line
                if ((isBookmarkDefined(activeBookmark.bookmarks[ n ])) &&
                    (activeBookmark.bookmarks[ n ].line !== vscode.window.activeTextEditor.selection.active.line)) {
                    revealPosition(activeBookmark.bookmarks[ n ].line, activeBookmark.bookmarks[ n ].column);
                    break;
                }

                // no, look for another document that contains that bookmark 
                // I CAN'T start from the first because _there can be duplicates_
                const currentFile: number = controller.indexFromPath(activeBookmark.path);
                let found = false;

                // to the end
                for (let index = currentFile; index < controller.files.length; index++) {
                    const element = controller.files[ index ];
                    if ((!found) && (element.path !== activeBookmark.path) && (isBookmarkDefined(element.bookmarks[ n ]))) {
                        found = true;
                        await revealPositionInDocument(element.bookmarks[n], controller.getFileUri(element));
                        return;
                    }
                }

                if (!found) {
                    for (let index = 0; index < currentFile; index++) {
                        const element = controller.files[ index ];
                        if ((!found) && (element.path !== activeBookmark.path) && (isBookmarkDefined(element.bookmarks[ n ]))) {
                            found = true;
                            await revealPositionInDocument(element.bookmarks[n], controller.getFileUri(element));
                            return;
                        }
                    }
                    
                    if (!found) {
                        if (vscode.workspace.getConfiguration("numberedBookmarks").get<boolean>("showBookmarkNotDefinedWarning", false)) {
                            vscode.window.showWarningMessage("The Bookmark " + n + " is not defined");
                        }
                        return;
                    }
                }

                break;
            }

            default: // "false"
                // is it already set?
                if (activeBookmark.bookmarks.length === 0) {
                    vscode.window.showInformationMessage("No Bookmark found");
                    return;
                }

                if (activeBookmark.bookmarks[ n ].line < 0) {
                    if (vscode.workspace.getConfiguration("numberedBookmarks").get<boolean>("showBookmarkNotDefinedWarning", false)) {
                        vscode.window.showWarningMessage("The Bookmark " + n + " is not defined");
                    }
                    return;
                }

                revealPosition(activeBookmark.bookmarks[ n ].line, activeBookmark.bookmarks[ n ].column);

                break;
        }
    }

}