/*---------------------------------------------------------------------------------------------
*  Copyright (c) Alessandro Fragnani. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import fs = require("fs");
import * as vscode from "vscode";
import { Uri } from "vscode";

import { Bookmark, BookmarkQuickPickItem, File } from "../vscode-numbered-bookmarks-core/src/api/bookmark";
import { MAX_BOOKMARKS, NO_BOOKMARK_DEFINED } from "../vscode-numbered-bookmarks-core/src/api/constants";
import { Controller } from "../vscode-numbered-bookmarks-core/src/model/controller";
import { clearBookmarks, indexOfBookmark, isBookmarkDefined, listBookmarks } from "../vscode-numbered-bookmarks-core/src/model/operations";
import { revealLine, revealPosition, previewPositionInDocument, revealPositionInDocument } from "../vscode-numbered-bookmarks-core/src/reveal";
import { Sticky } from "../vscode-numbered-bookmarks-core/src/sticky/sticky";
import { createLineDecoration } from "vscode-ext-decoration";
import { loadBookmarks, saveBookmarks } from "../vscode-numbered-bookmarks-core/src/workspaceState";
import { Container } from "../vscode-numbered-bookmarks-core/src/container";
import { registerWhatsNew } from "./whats-new/commands";
import { codicons } from "vscode-ext-codicons";
import { getRelativePath, parsePosition } from "../vscode-numbered-bookmarks-core/src/utils";

const STATE_SVG_VERSION = "numberedBookmarksSvgVersion";

const getFillColor = (): string => {
    const config = vscode.workspace
      .getConfiguration("numberedBookmarks")
      .inspect("gutterIconFillColor");
    
    return <string> (config.globalValue ? config.globalValue : config.defaultValue);
  };
  
const getNumberColor = (): string => {
    const config = vscode.workspace
      .getConfiguration("numberedBookmarks")
      .inspect("gutterIconNumberColor");
      
    return <string> (config.globalValue ? config.globalValue : config.defaultValue);
  };

// this method is called when vs code is activated
export async function activate(context: vscode.ExtensionContext) {

    Container.context = context;

    registerWhatsNew();

    let controller: Controller;
    // let activeController: Controller;
    let controllers: Controller[] = [];
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

    if (vscode.workspace.workspaceFolders) {
        controllers = await Promise.all(
            vscode.workspace.workspaceFolders!.map(async workspaceFolder => {
                const ctrl = loadBookmarks(workspaceFolder);

                return ctrl;
            })
        );
            
        console.log(controllers.length);
    }
    
    updateBookmarkSvg();
    updateBookmarkDecorationType();

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
    
    vscode.workspace.onDidChangeConfiguration(event => {    
        if (event.affectsConfiguration("numberedBookmarks.gutterIconFillColor") 
            || event.affectsConfiguration("numberedBookmarks.gutterIconNumberColor")    
        ) {
            context.globalState.update(
                STATE_SVG_VERSION, 
                getCurrentSvgVersion() + 1
            );
            updateBookmarkSvg();  
            updateBookmarkDecorationType();      
        }
    }, null, context.subscriptions);
    
    // The only way to update the decorations after changing the color is to create a new file
    function updateBookmarkSvg() {  
        const v = getCurrentSvgVersion();
        
        if (fs.existsSync(context.asAbsolutePath(`images/bookmark1-${v}.svg`))) {
            return;
        }
        
        const gutterIconFillColor = getFillColor();
        const gutterIconNumberColor = getNumberColor();
        const content = fs.readFileSync(context.asAbsolutePath("images/bookmark.svg"), "utf8");
        
        for (let i = 0; i <= 9; i++) {
            const svgContent = content
                .replace("{{gutterIconFillColor}}", gutterIconFillColor)
                .replace("{{gutterIconNumberColor}}", gutterIconNumberColor)
                .replace("{{number}}", i.toString());
                
            try {    
                fs.writeFileSync(context.asAbsolutePath(`images/bookmark${i}-${v}.svg`), svgContent, {encoding: "utf8"}); 
            } catch (err) {
                vscode.window.showErrorMessage(`Can't write to ${err.path}`);            
            }
            
            const bookmarkPath = context.asAbsolutePath(`images/bookmark${i}-${v - 1}.svg`);        
            if (fs.existsSync(bookmarkPath)) {
                fs.unlinkSync(bookmarkPath);
            }
        }   

        triggerUpdateDecorations(); 
    }
    
    // Need to udpate every time the color is changed
    function updateBookmarkDecorationType() {
        const v = getCurrentSvgVersion();
        
        for (let index = 0; index < MAX_BOOKMARKS; index++) {
            if (undefined !== bookmarkDecorationType[ index ]) {
                bookmarkDecorationType[ index ].dispose();
            }
            const gutterIconPath: string = context.asAbsolutePath(`images/bookmark${index}-${v}.svg`);   

            const overviewRulerColor = new vscode.ThemeColor('numberedBookmarks.overviewRuler');            
            const lineBackground = new vscode.ThemeColor('numberedBookmarks.lineBackground');
            const lineBorder = new vscode.ThemeColor('numberedBookmarks.lineBorder');

            bookmarkDecorationType[ index ] = createLineDecoration(lineBackground, lineBorder, 
                vscode.OverviewRulerLane.Full, overviewRulerColor,
                gutterIconPath);
        }
    }
    
    function getCurrentSvgVersion(): number {
        return parseInt(context.globalState.get(STATE_SVG_VERSION, "0"), 10);
    }

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
            const invalids = [];
            for (let index = 0; index < MAX_BOOKMARKS; index++) {
                books = [];
                if (activeBookmark.bookmarks[ index ].line < 0) {
                    activeEditor.setDecorations(getDecoration(index), books);
                } else {
                    const element = activeBookmark.bookmarks[ index ];
                    if (element.line < activeEditor.document.lineCount) {
                        const decoration = new vscode.Range(element.line, 0, element.line, 0);
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
        if (activeBookmark.bookmarks.length === 0) {
            vscode.window.showInformationMessage("No Bookmark found");
            return;
        }

        // push the items
        const items: vscode.QuickPickItem[] = [];
        // for (let index = 0; index < activeBookmark.bookmarks.length; index++) {
        //     let element = activeBookmark.bookmarks[ index ];
        for (const element of activeBookmark.bookmarks) {
            // > -> temporary fix for modified files
            // if ((element.line !== -1) && (element.line <= vscode.window.activeTextEditor.document.lineCount)) {
            //     const lineText = vscode.window.activeTextEditor.document.lineAt(element.line - 1).text;
            //     //?? element++;
            //     items.push({ label: element.line.toString(), description: lineText });
            // }
            if (element.line !== -1) {
                const bookmarkLine = element.line + 1;
                const bookmarkColumn = element.column + 1;
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
        let totalBookmarkCount = 0;
        // tslint:disable-next-line:prefer-for-of
        for (let index = 0; index < controller.files.length; index++) {
            totalBookmarkCount = totalBookmarkCount + controller.files[ index ].bookmarks.length;
        }
        if (totalBookmarkCount === 0) {
            vscode.window.showInformationMessage("No Bookmarks found");
            return;
        }

        // push the items
        const items: BookmarkQuickPickItem[] = [];
        // const activeTextEditorPath = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.document.uri.fsPath : "";
        const activeTextEditor = vscode.window.activeTextEditor;
        const promisses = [];
        const currentLine: number = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.selection.active.line + 1 : -1;

        let currentWorkspaceFolder: vscode.WorkspaceFolder; 
        if (activeTextEditor) {
            currentWorkspaceFolder = vscode.workspace.getWorkspaceFolder(activeTextEditor.document.uri);
        }            
        
        // tslint:disable-next-line:prefer-for-of
        for (let index = 0; index < controller.files.length; index++) {
            const file = controller.files[ index ];

            const pp = listBookmarks(file, controller.workspaceFolder);
            // const pp = bookmark.listBookmarks();
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

                        if (elementInside.detail.toString().toLowerCase() === getRelativePath(controller.workspaceFolder.uri.path, activeTextEditor.document.uri.path)) {//.fsPath.toLowerCase()) {
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
                            // const uriDocument: vscode.Uri = vscode.Uri.file(activeTextEditorPath);
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
                    // } else {    
                    //     // vscode.workspace.openTextDocument(selection.uri).then(doc => {
                    //     //     vscode.window.showTextDocument(doc).then(() => {
                    //     //         revealLine(parseInt(selection.label, 10) - 1);
                    //     //     });
                    //     // });
                    //     await revealPositionInDocument(point, selection.uri);
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
            controller.addFile(vscode.window.activeTextEditor.document.uri); // .fsPath);
            activeBookmark = controller.fromUri(vscode.window.activeTextEditor.document.uri);
        }

        // there is another bookmark already set for this line?
        // const index: number = activeBookmark.bookmarks.indexOf(position.line);
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
                // for (let index = 0; index < bookmarks.bookmarks.length; index++) {
                //     let element = bookmarks.bookmarks[ index ];
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
                    // for (let index = 0; index < bookmarks.bookmarks.length; index++) {
                    //     let element = bookmarks.bookmarks[ index ];
                    for (const element of controller.files) {
                        if ((element.path !== activeBookmark.path) && (isBookmarkDefined(element.bookmarks[ n ]))) {
                            // open and novigate
                            // const uriDocument: vscode.Uri = vscode.Uri.file(element.path);
                            // const uriDocument = controller.getFileUri(element);
                            // vscode.workspace.openTextDocument(uriDocument).then(doc => {
                                //     vscode.window.showTextDocument(doc, undefined, false).then(() => {
                                    //         revealPosition(element.bookmarks[n].line, element.bookmarks[n].column);
                                    //     });
                                    // });
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