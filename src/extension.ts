/*---------------------------------------------------------------------------------------------
*  Copyright (c) Alessandro Fragnani. All rights reserved.
*  Licensed under the GPLv3 License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import * as vscode from "vscode";
import { Position, TextDocument, Uri } from "vscode";

import { Bookmark, BookmarkQuickPickItem } from "../vscode-numbered-bookmarks-core/src/bookmark";
import { NO_BOOKMARK_DEFINED } from "../vscode-numbered-bookmarks-core/src/constants";
import { Controller } from "../vscode-numbered-bookmarks-core/src/controller";
import { clearBookmarks, hasBookmarks, indexOfBookmark, isBookmarkDefined, listBookmarks } from "../vscode-numbered-bookmarks-core/src/operations";
import { revealPosition, previewPositionInDocument, revealPositionInDocument } from "../vscode-numbered-bookmarks-core/src/utils/reveal";
import { Sticky } from "../vscode-numbered-bookmarks-core/src/stickyLegacy";
import { loadBookmarks, saveBookmarks } from "../vscode-numbered-bookmarks-core/src/workspaceState";
import { Container } from "../vscode-numbered-bookmarks-core/src/container";
import { registerWhatsNew } from "./whats-new/commands";
import { codicons } from "vscode-ext-codicons";
import { getRelativePath, parsePosition } from "../vscode-numbered-bookmarks-core/src/utils/fs";
import { File } from "../vscode-numbered-bookmarks-core/src/file";
import { updateBookmarkDecorationType, updateBookmarkSvg, updateDecorationsInActiveEditor, updateSvgVersion } from "./decoration";
import { pickController } from "../vscode-numbered-bookmarks-core/src/quickpick/controllerPicker";
import { updateStickyBookmarks } from "../vscode-numbered-bookmarks-core/src/sticky";

export async function activate(context: vscode.ExtensionContext) {

    Container.context = context;

    registerWhatsNew();

    let activeController: Controller;
    let controllers: Controller[] = [];
    let activeEditorCountLine: number;
    let timeout = null;    
    let activeEditor = vscode.window.activeTextEditor;
    let activeFile: File;            
    const bookmarkDecorationType: vscode.TextEditorDecorationType[] = [];

    // load pre-saved bookmarks
    await loadWorkspaceState();
    
    updateBookmarkSvg(triggerUpdateDecorations);
    updateBookmarkDecorationType(bookmarkDecorationType);

    // Connect it to the Editors Events
    if (activeEditor) {
        getActiveController(activeEditor.document);
        activeController.addFile(activeEditor.document.uri);
        activeEditorCountLine = activeEditor.document.lineCount;
        activeFile = activeController.fromUri(activeEditor.document.uri);
        triggerUpdateDecorations();
    }

    // new docs
    // vscode.workspace.onDidOpenTextDocument(doc => {
    //     // activeEditorCountLine = doc.lineCount;
    //     getActiveController(doc);
    //     activeController.addFile(doc.uri);
    // });

    vscode.window.onDidChangeActiveTextEditor(editor => {
        activeEditor = editor;
        if (editor) {
            activeEditorCountLine = editor.document.lineCount;
            getActiveController(editor.document);
            activeController.addFile(editor.document.uri);
            activeFile = activeController.fromUri(editor.document.uri);
            
            triggerUpdateDecorations();
        }
    }, null, context.subscriptions);

    vscode.workspace.onDidChangeTextDocument(event => {
        if (activeEditor && event.document === activeEditor.document) {
            let updatedBookmark = true;
            // call sticky function when the activeEditor is changed
            if (activeFile && activeFile.bookmarks.length > 0) {
                if (vscode.workspace.getConfiguration("numberedBookmarks").get<boolean>("experimental.enableNewStickyEngine", true)) {
                    updatedBookmark = updateStickyBookmarks(event, activeFile,
                        activeEditor, activeController);
                } else {
                    updatedBookmark = Sticky.stickyBookmarks(event, activeEditorCountLine, 
                        activeFile, activeEditor);
                }
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
        updateDecorationsInActiveEditor(activeEditor, activeFile, getDecoration);
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
        clearBookmarks(activeFile);
        
        saveWorkspaceState();
        updateDecorations();
    });

    vscode.commands.registerCommand("numberedBookmarks.clearFromAllFiles", async () => {
        
        const controller = await pickController(controllers, activeController);
        if (!controller) {
            return
        }

        for (const file of controller.files) {
            clearBookmarks(file);
        }

        saveWorkspaceState();
        updateDecorations();
    });

    vscode.commands.registerCommand("numberedBookmarks.list", () => {
        // no bookmark
        if (!hasBookmarks(activeFile)) {
            vscode.window.showInformationMessage("No Bookmarks found");
            return;
        }

        // push the items
        const items: vscode.QuickPickItem[] = [];
        for (const bookmark of activeFile.bookmarks) {
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
        const currentPosition: Position = vscode.window.activeTextEditor.selection.active;
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
                revealPosition(currentPosition.line, currentPosition.character);
                return;
            }
            const itemT = <vscode.QuickPickItem> selection;
            const point: Bookmark = parsePosition(itemT.description);
            if (point) {
                revealPosition(point.line - 1, point.column - 1);
            }
        });
    });
    
 vscode.commands.registerCommand("numberedBookmarks.listFromAllFiles", async () => {

        const controller = await pickController(controllers, activeController);
        if (!controller) {
            return
        }

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
        const currentPosition: Position = vscode.window.activeTextEditor?.selection.active;

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

                        if (activeTextEditor && 
                            elementInside.detail.toString().toLocaleLowerCase() === getRelativePath(controller.workspaceFolder?.uri?.path, activeTextEditor.document.uri.path).toLocaleLowerCase()) {
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
                                vscode.window.showTextDocument(doc).then(() => {
                                    revealPosition(currentPosition.line, currentPosition.character)
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

    function getActiveController(document: TextDocument): void {
        // system files don't have workspace, so use the first one [0]
        if (!vscode.workspace.getWorkspaceFolder(document.uri)) {
            activeController = controllers[0];
            return;
        }

        if (controllers.length > 1) {
            activeController = controllers.find(ctrl =>
                ctrl.workspaceFolder.uri.path === vscode.workspace.getWorkspaceFolder(document.uri).uri.path);
        }
    }

    async function loadWorkspaceState(): Promise<void> {

        // no workspace, load as `undefined` and will always be from `workspaceState`
        if (!vscode.workspace.workspaceFolders) {
            const ctrl = await loadBookmarks(undefined);
            controllers.push(ctrl);
            activeController = ctrl;
            return;
        }

        // NOT `saveBookmarksInProject`
        if (!vscode.workspace.getConfiguration("numberedBookmarks").get("saveBookmarksInProject", false)) {
            //if (vscode.workspace.workspaceFolders.length > 1) {
            // no matter how many workspaceFolders exists, will always load from [0] because even with 
            // multi-root, there would be no way to load state from different folders
            const ctrl = await loadBookmarks(vscode.workspace.workspaceFolders[0]);
            controllers.push(ctrl);
            activeController = ctrl;
            return;
        }

        // `saveBookmarksInProject` TRUE
        // single or multi-root, will load from each `workspaceFolder`
        controllers = await Promise.all(
            vscode.workspace.workspaceFolders!.map(async workspaceFolder => {
                const ctrl = await loadBookmarks(workspaceFolder);
                return ctrl;
            })
        );
        if (controllers.length === 1) {
            activeController = controllers[0];
        }
    }

    function saveWorkspaceState(): void {
        // no workspace, there is only one `controller`, and will always be from `workspaceState`
        if (!vscode.workspace.workspaceFolders) {
            saveBookmarks(activeController);
            return;
        }

        // NOT `saveBookmarksInProject`, will load from `workspaceFolders[0]` - as before
        if (!vscode.workspace.getConfiguration("numberedBookmarks").get("saveBookmarksInProject", false)) {
            // no matter how many workspaceFolders exists, will always save to [0] because even with
            // multi-root, there would be no way to save state to different folders
            saveBookmarks(activeController);
            return;
        }

        // `saveBookmarksInProject` TRUE
        // single or multi-root, will save to each `workspaceFolder` 
        controllers.forEach(controller => {
            saveBookmarks(controller);
        });
    }

    function toggleBookmark(n: number, position: vscode.Position) {
        // fix issue emptyAtLaunch
        if (!activeFile) {
            activeController.addFile(vscode.window.activeTextEditor.document.uri); 
            activeFile = activeController.fromUri(vscode.window.activeTextEditor.document.uri);
        }

        // there is another bookmark already set for this line?
        const index: number = indexOfBookmark(activeFile, position.line);
        if (index >= 0) {
            clearBookmark(index);
        }

        // if was myself, then I want to 'remove'
        if (index !== n) {
            activeFile.bookmarks[ n ] = {
                line: position.line,
                column: position.character
            }

            // when _toggling_ only "replace" differs, because it has to _invalidate_ that bookmark from other files 
            const navigateThroughAllFiles: string = vscode.workspace.getConfiguration("numberedBookmarks").get("navigateThroughAllFiles", "false");
            if (navigateThroughAllFiles === "replace") {
                for (const element of activeController.files) {
                    if (element.path !== activeFile.path) {
                        element.bookmarks[ n ] = NO_BOOKMARK_DEFINED;
                    }
                }
            }
        }

        saveWorkspaceState();
        updateDecorations();
    }

    function clearBookmark(n: number) {
        activeFile.bookmarks[ n ] = NO_BOOKMARK_DEFINED;
    }

    async function jumpToBookmark(n: number) {
        if (!activeFile) {
            return;
        }

        // when _jumping_ each config has its own behavior 
        const navigateThroughAllFiles: string = vscode.workspace.getConfiguration("numberedBookmarks").get("navigateThroughAllFiles", "false");
        switch (navigateThroughAllFiles) {
            case "replace":
                // is it already set?
                if (activeFile.bookmarks[ n ].line < 0) {

                    // no, look for another document that contains that bookmark 
                    // I can start from the first because _there is only one_
                    for (const element of activeController.files) {
                        if ((element.path !== activeFile.path) && (isBookmarkDefined(element.bookmarks[ n ]))) {
                            await revealPositionInDocument(element.bookmarks[n], activeController.getFileUri(element));
                            return;
                        }
                    }
                } else {
                    revealPosition(activeFile.bookmarks[ n ].line, activeFile.bookmarks[ n ].column);
                }

                break;

            case "allowDuplicates": {

                // this file has, and I'm not in the line
                if ((isBookmarkDefined(activeFile.bookmarks[ n ])) &&
                    (activeFile.bookmarks[ n ].line !== vscode.window.activeTextEditor.selection.active.line)) {
                    revealPosition(activeFile.bookmarks[ n ].line, activeFile.bookmarks[ n ].column);
                    break;
                }

                // no, look for another document that contains that bookmark 
                // I CAN'T start from the first because _there can be duplicates_
                const currentFile: number = activeController.indexFromPath(activeFile.path);
                let found = false;

                // to the end
                for (let index = currentFile; index < activeController.files.length; index++) {
                    const element = activeController.files[ index ];
                    if ((!found) && (element.path !== activeFile.path) && (isBookmarkDefined(element.bookmarks[ n ]))) {
                        found = true;
                        await revealPositionInDocument(element.bookmarks[n], activeController.getFileUri(element));
                        return;
                    }
                }

                if (!found) {
                    for (let index = 0; index < currentFile; index++) {
                        const element = activeController.files[ index ];
                        if ((!found) && (element.path !== activeFile.path) && (isBookmarkDefined(element.bookmarks[ n ]))) {
                            found = true;
                            await revealPositionInDocument(element.bookmarks[n], activeController.getFileUri(element));
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
                if (activeFile.bookmarks.length === 0) {
                    vscode.window.showInformationMessage("No Bookmark found");
                    return;
                }

                if (activeFile.bookmarks[ n ].line < 0) {
                    if (vscode.workspace.getConfiguration("numberedBookmarks").get<boolean>("showBookmarkNotDefinedWarning", false)) {
                        vscode.window.showWarningMessage("The Bookmark " + n + " is not defined");
                    }
                    return;
                }

                revealPosition(activeFile.bookmarks[ n ].line, activeFile.bookmarks[ n ].column);

                break;
        }
    }

}