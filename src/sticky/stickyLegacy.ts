/*---------------------------------------------------------------------------------------------
*  Copyright (c) Castellant Guillaume & Alessandro Fragnani. All rights reserved.
*  Licensed under the GPLv3 License. See License.md in the project root for license information.
*
*  Original Author: Castellant Guillaume (@Terminux), 
*                   (https://github.com/alefragnani/vscode-bookmarks/pull/20)
*--------------------------------------------------------------------------------------------*/

import * as vscode from "vscode";
import { File } from "../core/file";
import { NO_BOOKMARK_DEFINED } from "../core/constants";
import { indexOfBookmark } from "../core/operations";

export class Sticky {
    
    public static stickyBookmarks(event: vscode.TextDocumentChangeEvent, activeEditorCountLine: number, activeBookmark: File, activeEditor: vscode.TextEditor): boolean {

        let diffLine: number;
        let updatedBookmark = false;

        // fix autoTrimWhitespace
        // if (event.contentChanges.length === 1) {
        if (this.hadOnlyOneValidContentChange(event)) {
            // add or delete line case
            if (event.document.lineCount !== activeEditorCountLine) {
                if (event.document.lineCount > activeEditorCountLine) {
                    diffLine = event.document.lineCount - activeEditorCountLine;
                } else if (event.document.lineCount < activeEditorCountLine) {
                    diffLine = activeEditorCountLine - event.document.lineCount;
                    diffLine = 0 - diffLine;

                    // one line up
                    if (event.contentChanges[ 0 ].range.end.line - event.contentChanges[ 0 ].range.start.line === 1) {

                        if ((event.contentChanges[ 0 ].range.end.character === 0) &&
                            (event.contentChanges[ 0 ].range.start.character === 0)) {
                            // the bookmarked one
                            const idxbk = indexOfBookmark(activeBookmark, event.contentChanges[ 0 ].range.start.line);
                            // const idxbk = activeBookmark.bookmarks.indexOf(event.contentChanges[ 0 ].range.start.line);
                            if (idxbk > -1) {
                                activeBookmark.bookmarks[ idxbk ] = NO_BOOKMARK_DEFINED;
                            }
                        }
                    }

                    if (event.contentChanges[ 0 ].range.end.line - event.contentChanges[ 0 ].range.start.line > 1) {
                        for (let i = event.contentChanges[ 0 ].range.start.line/* + 1*/; i <= event.contentChanges[ 0 ].range.end.line; i++) {
                            const index = indexOfBookmark(activeBookmark, i);
                            // const index = activeBookmark.bookmarks.indexOf(i);

                            if (index > -1) {
                                activeBookmark.bookmarks[ index ] = NO_BOOKMARK_DEFINED;
                                updatedBookmark = true;
                            }
                        }
                    }
                }

                // for (let index in activeBookmark.bookmarks) {
                for (let index = 0; index < activeBookmark.bookmarks.length; index++) {
                    const eventLine = event.contentChanges[ 0 ].range.start.line;
                    let eventcharacter = event.contentChanges[ 0 ].range.start.character;

                    // indent ?
                    if (eventcharacter > 0) {
                        let textInEventLine = activeEditor.document.lineAt(eventLine).text;
                        textInEventLine = textInEventLine.replace(/\t/g, "").replace(/\s/g, "");
                        if (textInEventLine === "") {
                            eventcharacter = 0;
                        }
                    }

                    // also =
                    if (
                        ((activeBookmark.bookmarks[ index ].line > eventLine) && (eventcharacter > 0)) ||
                        ((activeBookmark.bookmarks[ index ].line >= eventLine) && (eventcharacter === 0))
                    ) {
                        let newLine = activeBookmark.bookmarks[ index ].line + diffLine;
                        if (newLine < 0) {
                            newLine = 0;
                        }

                        activeBookmark.bookmarks[ index ].line = newLine;
                        updatedBookmark = true;
                    }
                }
            }

            // paste case
            if (!updatedBookmark && (event.contentChanges[ 0 ].text.length > 1)) {
                const selection = vscode.window.activeTextEditor.selection;
                const lineRange = [ selection.start.line, selection.end.line ];
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
                        const index = activeBookmark.bookmarks.indexOf(i);
                        if (index > -1) {
                            activeBookmark.bookmarks[ index ] = NO_BOOKMARK_DEFINED;
                            updatedBookmark = true;
                        }
                    }
                }
            }
        } else if (event.contentChanges.length === 2) {
            // move line up and move line down case
            if (activeEditor.selections.length === 1) {
                if (event.contentChanges[ 0 ].text === "") {
                    updatedBookmark = this.moveStickyBookmarks("down", activeBookmark, activeEditor);
                } else if (event.contentChanges[ 1 ].text === "") {
                    updatedBookmark = this.moveStickyBookmarks("up", activeBookmark, activeEditor);
                }
            }
        }

        return updatedBookmark;
    }
    
    private static moveStickyBookmarks(direction: string, activeBookmark: File, activeEditor: vscode.TextEditor): boolean {
        let diffChange = -1;
        let updatedBookmark = false;
        let diffLine;
        const selection = activeEditor.selection;
        let lineRange = [ selection.start.line, selection.end.line ];
        const lineMin = Math.min.apply(this, lineRange);
        let lineMax = Math.max.apply(this, lineRange);

        if (selection.end.character === 0 && !selection.isSingleLine) {
            // const lineAt = activeEditor.document.lineAt(selection.end.line);
            // const posMin = new vscode.Position(selection.start.line + 1, selection.start.character);
            // const posMax = new vscode.Position(selection.end.line, lineAt.range.end.character);
            // vscode.window.activeTextEditor.selection = new vscode.Selection(posMin, posMax);
            lineMax--;
        }

        if (direction === "up") {
            diffLine = 1;

            const index = indexOfBookmark(activeBookmark, lineMin - 1);
            // const index = activeBookmark.bookmarks.indexOf(lineMin - 1);
            if (index > -1) {
                diffChange = lineMax;
                activeBookmark.bookmarks[ index ] = NO_BOOKMARK_DEFINED;
                updatedBookmark = true;
            }
        } else if (direction === "down") {
            diffLine = -1;

            const index = activeBookmark.bookmarks.indexOf(lineMax + 1);
            if (index > -1) {
                diffChange = lineMin;
                activeBookmark.bookmarks[ index ] = NO_BOOKMARK_DEFINED;
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

// tslint:disable-next-line: forin
        for (const i in lineRange) {
            const index = indexOfBookmark(activeBookmark, lineRange[ i ]);
            // const index = activeBookmark.bookmarks.indexOf(lineRange[ i ]);
            if (index > -1) {
                activeBookmark.bookmarks[ index ].line -= diffLine;
                updatedBookmark = true;
            }
        }

        if (diffChange > -1) {
            //?? activeBookmark.bookmarks.push(diffChange);
            activeBookmark.bookmarks.push({line: diffChange, column: 0});
            updatedBookmark = true;
        }

        return updatedBookmark;
    }
    
    private static hadOnlyOneValidContentChange(event: vscode.TextDocumentChangeEvent): boolean {

        // not valid
        if ((event.contentChanges.length > 2) || (event.contentChanges.length === 0)) {
            return false;
        }

        // normal behavior - only 1
        if (event.contentChanges.length === 1) {
            return true;
        } else { // has 2, but is it a trimAutoWhitespace issue?
            if (event.contentChanges.length === 2) {
                const trimAutoWhitespace: boolean = vscode.workspace.getConfiguration("editor").get("trimAutoWhitespace", true);
                if (!trimAutoWhitespace) {
                    return false;
                }

                // check if the first range is 'equal' and if the second is 'empty'
                let fistRangeEquals: boolean =
                    (event.contentChanges[ 0 ].range.start.character === event.contentChanges[ 0 ].range.end.character) &&
                    (event.contentChanges[ 0 ].range.start.line === event.contentChanges[ 0 ].range.end.line);

                let secondRangeEmpty: boolean = (event.contentChanges[ 1 ].text === "") &&
                    (event.contentChanges[ 1 ].range.start.line === event.contentChanges[ 1 ].range.end.line) &&
                    (event.contentChanges[ 1 ].range.start.character === 0) &&
                    (event.contentChanges[ 1 ].range.end.character > 0);

                if (fistRangeEquals && secondRangeEmpty) {
                    return true;
                } else {
                    fistRangeEquals =
                        (event.contentChanges[ 0 ].rangeLength > 0) &&
                        (event.contentChanges[ 0 ].text === "");
                    secondRangeEmpty =
                        (event.contentChanges[ 1 ].rangeLength === 0) &&
                        (event.contentChanges[ 1 ].text === "\r\n");

                    return fistRangeEquals && secondRangeEmpty;
                }
            }
        }
    }
    
}
