/*---------------------------------------------------------------------------------------------
*  Copyright (c) Alessandro Fragnani. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import fs = require("fs");
import path = require("path");
import * as vscode from "vscode";

import { File } from "../vscode-numbered-bookmarks-core/src/api/bookmark";
import { MAX_BOOKMARKS, NO_BOOKMARK_DEFINED } from "../vscode-numbered-bookmarks-core/src/api/constants";
// import { File } from "../vscode-numbered-bookmarks-core/src/model/bookmark";
import { Controller } from "../vscode-numbered-bookmarks-core/src/model/controller";
import { clearBookmarks, listBookmarks } from "../vscode-numbered-bookmarks-core/src/model/operations";
import { Sticky } from "../vscode-numbered-bookmarks-core/src/sticky/sticky";
import { createLineDecoration } from "vscode-ext-decoration";
import { loadBookmarks, saveBookmarks } from "../vscode-numbered-bookmarks-core/src/workspaceState";
import { Container } from "../vscode-numbered-bookmarks-core/src/container";
import { registerWhatsNew } from "./whats-new/commands";
import { codicons } from "vscode-ext-codicons";

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

    //const bookmarks: Bookmarks = new Bookmarks();
    let controller: Controller;
    let activeController: Controller;
    let controllers: Controller[] = [];
    let activeEditorCountLine: number;
    let timeout = null;    
    let activeEditor = vscode.window.activeTextEditor;
    let activeBookmark: File;            
    const bookmarkDecorationType: vscode.TextEditorDecorationType[] = [];

    // load pre-saved bookmarks
    let didLoadBookmarks: boolean;
    if (vscode.workspace.workspaceFolders) {
        didLoadBookmarks = loadWorkspaceState(vscode.workspace.workspaceFolders[0]); // activeEditor.document.uri);
    } else {
        didLoadBookmarks = loadWorkspaceState(undefined);
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
        if (!didLoadBookmarks) {
            controller.addFile(activeEditor.document.uri);
        }
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
            
            activeController = controllers.find(ctrl => 
                   ctrl.workspaceFolder.uri.path === vscode.workspace.getWorkspaceFolder(editor.document.uri).uri.path)

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
                if (activeBookmark.bookmarks[ index ] < 0) {
                    activeEditor.setDecorations(getDecoration(index), books);
                } else {
                    const element = activeBookmark.bookmarks[ index ];
                    if (element < activeEditor.document.lineCount) {
                        const decoration = new vscode.Range(element, 0, element, 0);
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
            () => toggleBookmark(i, vscode.window.activeTextEditor.selection.active.line)
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
        for (let element of activeBookmark.bookmarks) {
            // > -> temporary fix for modified files
            if ((element !== -1) && (element <= vscode.window.activeTextEditor.document.lineCount)) {
                const lineText = vscode.window.activeTextEditor.document.lineAt(element).text;
                element++;
                items.push({ label: element.toString(), description: lineText });
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
        const items: vscode.QuickPickItem[] = [];
        const activeTextEditorPath = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.document.uri.fsPath : "";
        const promisses = [];
        const currentLine: number = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.selection.active.line + 1 : -1;

        let currentWorkspaceFolder: vscode.WorkspaceFolder; 
        if (activeTextEditorPath) {
            currentWorkspaceFolder = vscode.workspace.getWorkspaceFolder(vscode.Uri.file(activeTextEditorPath));
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

                        if (elementInside.detail.toString().toLowerCase() === activeTextEditorPath.toLowerCase()) {
                            items.push(
                                {
                                    label: elementInside.label,
                                    description: elementInside.description
                                }
                            );
                        } else {
                            const itemPath = removeBasePathFrom(elementInside.detail, currentWorkspaceFolder);
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
                const itemsSorted: vscode.QuickPickItem[] = items.sort(function(a: vscode.QuickPickItem, b: vscode.QuickPickItem): number {
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

                        const itemT = <vscode.QuickPickItem> item

                        let filePath: string;
                        // no detail - previously active document
                        if (!itemT.detail) {
                            filePath = activeTextEditorPath;
                        } else {
                            // with octicon - document outside project
                            if (itemT.detail.toString().indexOf(codicons.file_directory + " ") === 0) {
                                filePath = itemT.detail.toString().split(codicons.file_directory + " ").pop();
                            } else { // with octicon - documento from other workspaceFolder
                                if (itemT.detail.toString().indexOf(codicons.file_submodule) === 0) {
                                    filePath = itemT.detail.toString().split(codicons.file_submodule + " ").pop();
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
                            const uriDocument: vscode.Uri = vscode.Uri.file(filePath);
                            vscode.workspace.openTextDocument(uriDocument).then(doc => {
                                // vscode.window.showTextDocument(doc, undefined, true).then(editor => {
                                vscode.window.showTextDocument(doc, {preserveFocus: true, preview: true}).then(() => {
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
                            const uriDocument: vscode.Uri = vscode.Uri.file(activeTextEditorPath);
                            vscode.workspace.openTextDocument(uriDocument).then(doc => {
                                vscode.window.showTextDocument(doc).then(() => {
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
                        if (selection.detail.toString().indexOf(codicons.file_directory + " ") === 0) {
                            newPath = selection.detail.toString().split(codicons.file_directory + " ").pop();
                        } else {// no octicon - document inside project
                            if (selection.detail.toString().indexOf(codicons.file_submodule) === 0) {
                                newPath = selection.detail.toString().split(codicons.file_submodule + " ").pop();
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
                        const uriDocument: vscode.Uri = vscode.Uri.file(newPath);
                        vscode.workspace.openTextDocument(uriDocument).then(doc => {
                            vscode.window.showTextDocument(doc).then(() => {
                                revealLine(parseInt(selection.label, 10) - 1);
                            });
                        });
                    }
                });
            }
        );
    });

    function revealLine(line: number, directJump?: boolean) {
        const newSe = new vscode.Selection(line, 0, line, 0);
        vscode.window.activeTextEditor.selection = newSe;
        if (directJump) {
            vscode.window.activeTextEditor.revealRange(newSe, vscode.TextEditorRevealType.InCenterIfOutsideViewport);
        } else {
            vscode.window.activeTextEditor.revealRange(newSe, vscode.TextEditorRevealType.InCenter);
        }
    }

    // function loadWorkspaceState(): boolean {
    //     return loadBookmarks(bookmarks, context);
    // }

    // function saveWorkspaceState(): void {
    //     saveBookmarks(bookmarks, context);
    function canSaveBookmarksInProject(): boolean {
        let saveBookmarksInProject: boolean = vscode.workspace.getConfiguration("numberedBookmarks").get("saveBookmarksInProject", false);
        
        // really use saveBookmarksInProject
        // 0. has at least a folder opened
        // 1. is a valid workspace/folder
        // 2. has only one workspaceFolder
        // let hasBookmarksFile: boolean = false;
        if (saveBookmarksInProject && ((!vscode.workspace.workspaceFolders) || (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 1))) {
            saveBookmarksInProject = false;
        }

        return saveBookmarksInProject;
    }

    function loadWorkspaceState(workspaceFolder: vscode.WorkspaceFolder): boolean {
        const saveBookmarksInProject: boolean = canSaveBookmarksInProject();

        controller = new Controller(workspaceFolder); // vscode.workspace.getWorkspaceFolder(uri));

        if (saveBookmarksInProject) {
            if (!vscode.workspace.workspaceFolders) {
                return false;
            }

            const bookmarksFileInProject: string = path.join(workspaceFolder.uri.fsPath, ".vscode", "numbered-bookmarks.json");
            if (!fs.existsSync(bookmarksFileInProject)) {
                return false;
            }
            
            try {
                controller.loadFrom(JSON.parse(fs.readFileSync(bookmarksFileInProject).toString()), true);
                return true;
            } catch (error) {
                vscode.window.showErrorMessage("Error loading Numbered Bookmarks: " + error.toString());
                return false;
            }
        } else {
            const savedBookmarks = context.workspaceState.get("numberedBookmarks", "");
            if (savedBookmarks !== "") {
                controller.loadFrom(JSON.parse(savedBookmarks));
            }
            return savedBookmarks !== "";
        }
    }

    function loadBookmarks(workspaceFolder: vscode.WorkspaceFolder): Controller {
        const saveBookmarksInProject: boolean = canSaveBookmarksInProject();

        const newController = new Controller(workspaceFolder);

        if (saveBookmarksInProject) {
            const bookmarksFileInProject: string = path.join(workspaceFolder.uri.fsPath, ".vscode", "numbered-bookmarks.json");
            if (!fs.existsSync(bookmarksFileInProject)) {
                return newController;
            }
            
            try {
                newController.loadFrom(JSON.parse(fs.readFileSync(bookmarksFileInProject).toString()), true);
                return newController;
            } catch (error) {
                vscode.window.showErrorMessage("Error loading Numbered Bookmarks: " + error.toString());
                return newController;
            }
        } else {
            const savedBookmarks = context.workspaceState.get("numberedBookmarks", "");
            if (savedBookmarks !== "") {
                newController.loadFrom(JSON.parse(savedBookmarks));
            }
            return newController;
        }
    }    

    function saveWorkspaceState(): void {
        // return;
        const saveBookmarksInProject: boolean = canSaveBookmarksInProject();

        if (saveBookmarksInProject) {
            const bookmarksFileInProject: string = path.join(vscode.workspace.workspaceFolders[0].uri.fsPath, ".vscode", "numbered-bookmarks.json");
            if (!fs.existsSync(path.dirname(bookmarksFileInProject))) {
                fs.mkdirSync(path.dirname(bookmarksFileInProject));
            }
            fs.writeFileSync(bookmarksFileInProject, JSON.stringify(controller.zip(), null, "\t"));
        } else {
            context.workspaceState.update("numberedBookmarks", JSON.stringify(controller.zip()));
        }
    }

    function toggleBookmark(n: number, line: number) {
        // fix issue emptyAtLaunch
        if (!activeBookmark) {
            controller.addFile(vscode.window.activeTextEditor.document.uri); // .fsPath);
            activeBookmark = controller.fromUri(vscode.window.activeTextEditor.document.uri);
        }

        // there is another bookmark already set for this line?
        const index: number = activeBookmark.bookmarks.indexOf(line);
        if (index >= 0) {
            clearBookmark(index);
        }

        // if was myself, then I want to 'remove'
        if (index !== n) {
            activeBookmark.bookmarks[ n ] = line;

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

    function jumpToBookmark(n: number) {
        if (!activeBookmark) {
            return;
        }

        // when _jumping_ each config has its own behavior 
        const navigateThroughAllFiles: string = vscode.workspace.getConfiguration("numberedBookmarks").get("navigateThroughAllFiles", "false");
        switch (navigateThroughAllFiles) {
            case "replace":
                // is it already set?
                if (activeBookmark.bookmarks[ n ] < 0) {

                    // no, look for another document that contains that bookmark 
                    // I can start from the first because _there is only one_
                    // for (let index = 0; index < bookmarks.bookmarks.length; index++) {
                    //     let element = bookmarks.bookmarks[ index ];
                    for (const element of controller.files) {
                        if ((element.path !== activeBookmark.path) && (element.bookmarks[ n ] !== NO_BOOKMARK_DEFINED)) {
                            // open and novigate
                            const uriDocument: vscode.Uri = vscode.Uri.file(element.path);
                            vscode.workspace.openTextDocument(uriDocument).then(doc => {
                                vscode.window.showTextDocument(doc, undefined, false).then(() => {
                                    revealLine(element.bookmarks[ n ]);
                                });
                            });
                        }
                    }
                } else {
                    revealLine(activeBookmark.bookmarks[ n ], true);
                }

                break;

            case "allowDuplicates": {

                // this file has, and I'm not in the line
                if ((activeBookmark.bookmarks[ n ] > NO_BOOKMARK_DEFINED) &&
                    (activeBookmark.bookmarks[ n ] !== vscode.window.activeTextEditor.selection.active.line)) {
                    revealLine(activeBookmark.bookmarks[ n ], true);
                    break;
                }

                // no, look for another document that contains that bookmark 
                // I CAN'T start from the first because _there can be duplicates_
                const currentFile: number = controller.indexFromPath(activeBookmark.path);
                let found: boolean = false;

                // to the end
                for (let index = currentFile; index < controller.files.length; index++) {
                    const element = controller.files[ index ];
                    if ((!found) && (element.path !== activeBookmark.path) && (element.bookmarks[ n ] !== NO_BOOKMARK_DEFINED)) {
                        found = true;
                        // open and novigate
                        const uriDocument: vscode.Uri = vscode.Uri.file(element.path);
                        vscode.workspace.openTextDocument(uriDocument).then(doc => {
                            vscode.window.showTextDocument(doc, undefined, false).then(() => {
                                revealLine(element.bookmarks[ n ]);
                            });
                        });
                    }
                }

                if (!found) {
                    for (let index = 0; index < currentFile; index++) {
                        const element = controller.files[ index ];
                        if ((!found) && (element.path !== activeBookmark.path) && (element.bookmarks[ n ] !== NO_BOOKMARK_DEFINED)) {
                            // open and novigate
                            found = true;
                            const uriDocument: vscode.Uri = vscode.Uri.file(element.path);
                            vscode.workspace.openTextDocument(uriDocument).then(doc => {
                                vscode.window.showTextDocument(doc, undefined, false).then(() => {
                                    revealLine(element.bookmarks[ n ]);
                                });
                            });
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
                if (activeBookmark.bookmarks[ n ] < 0) {
                    if (vscode.workspace.getConfiguration("numberedBookmarks").get<boolean>("showBookmarkNotDefinedWarning", false)) {
                        vscode.window.showWarningMessage("The Bookmark " + n + " is not defined");
                    }
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
                    return codicons.file_submodule + " " + inWorkspace.name + /*path.sep + */aPath.split(inWorkspace.uri.fsPath).pop();
                }
            }
            // const base: string = inWorkspace.name ? inWorkspace.name : inWorkspace.uri.fsPath;
            // return path.join(base, aPath.split(inWorkspace.uri.fsPath).pop());
            // return aPath.split(inWorkspace.uri.fsPath).pop();
        } else {
            return codicons.file_directory + " " + aPath;
        }
    }
}