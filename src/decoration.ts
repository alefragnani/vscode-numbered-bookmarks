/*---------------------------------------------------------------------------------------------
*  Copyright (c) Alessandro Fragnani. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import fs = require("fs");
import { OverviewRulerLane, Range, TextEditor, TextEditorDecorationType, ThemeColor, window, workspace } from "vscode";
import { createLineDecoration } from "vscode-ext-decoration";
import { MAX_BOOKMARKS, NO_BOOKMARK_DEFINED } from "../vscode-numbered-bookmarks-core/src/constants";
import { Container } from "../vscode-numbered-bookmarks-core/src/container";
import { File } from "../vscode-numbered-bookmarks-core/src/file";

const STATE_SVG_VERSION = "numberedBookmarksSvgVersion";

const getFillColor = (): string => {
    const config = workspace
      .getConfiguration("numberedBookmarks")
      .inspect("gutterIconFillColor");
    
    return <string> (config.globalValue ? config.globalValue : config.defaultValue);
  };
  
const getNumberColor = (): string => {
    const config = workspace
      .getConfiguration("numberedBookmarks")
      .inspect("gutterIconNumberColor");
      
    return <string> (config.globalValue ? config.globalValue : config.defaultValue);
};

function getCurrentSvgVersion(): number {
    return parseInt(Container.context.globalState.get(STATE_SVG_VERSION, "0"), 10);
}

export function updateSvgVersion(): void {
    Container.context.globalState.update(
        STATE_SVG_VERSION, 
        getCurrentSvgVersion() + 1
    );
}

// Need to udpate every time the color is changed
export function updateBookmarkDecorationType(bookmarkDecorationType: TextEditorDecorationType[]) {
    const v = getCurrentSvgVersion();
    
    for (let index = 0; index < MAX_BOOKMARKS; index++) {
        if (undefined !== bookmarkDecorationType[ index ]) {
            bookmarkDecorationType[ index ].dispose();
        }
        const gutterIconPath: string = Container.context.asAbsolutePath(`images/bookmark${index}-${v}.svg`);   

        const overviewRulerColor = new ThemeColor('numberedBookmarks.overviewRuler');            
        const lineBackground = new ThemeColor('numberedBookmarks.lineBackground');
        const lineBorder = new ThemeColor('numberedBookmarks.lineBorder');

        bookmarkDecorationType[ index ] = createLineDecoration(lineBackground, lineBorder, 
            OverviewRulerLane.Full, overviewRulerColor,
            gutterIconPath);
    }
}  

// The only way to update the decorations after changing the color is to create a new file
export function updateBookmarkSvg(triggerUpdateDecorations) {  
    const v = getCurrentSvgVersion();
    
    if (fs.existsSync(Container.context.asAbsolutePath(`images/bookmark1-${v}.svg`))) {
        return;
    }
    
    const gutterIconFillColor = getFillColor();
    const gutterIconNumberColor = getNumberColor();
    const content = fs.readFileSync(Container.context.asAbsolutePath("images/bookmark.svg"), "utf8");
    
    for (let i = 0; i <= 9; i++) {
        const svgContent = content
            .replace("{{gutterIconFillColor}}", gutterIconFillColor)
            .replace("{{gutterIconNumberColor}}", gutterIconNumberColor)
            .replace("{{number}}", i.toString());
            
        try {    
            fs.writeFileSync(Container.context.asAbsolutePath(`images/bookmark${i}-${v}.svg`), svgContent, {encoding: "utf8"}); 
        } catch (err) {
            window.showErrorMessage(`Can't write to ${err.path}`);            
        }
        
        const bookmarkPath = Container.context.asAbsolutePath(`images/bookmark${i}-${v - 1}.svg`);        
        if (fs.existsSync(bookmarkPath)) {
            fs.unlinkSync(bookmarkPath);
        }
    }   

    triggerUpdateDecorations(); 
}

export function updateDecorationsInActiveEditor(activeEditor: TextEditor, activeBookmark: File,
    getDecoration) {
    
    if (!activeEditor) {
        return;
    }

    if (!activeBookmark) {
        return;
    }

    let books: Range[] = [];
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
                    const decoration = new Range(element.line, 0, element.line, 0);
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