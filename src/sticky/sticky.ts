/*---------------------------------------------------------------------------------------------
*  Copyright (c) Castellant Guillaume & Alessandro Fragnani. All rights reserved.
*  Licensed under the GPLv3 License. See License.md in the project root for license information.
*
*  Original Author: Castellant Guillaume (@Terminux), 
*                   (https://github.com/alefragnani/vscode-bookmarks/pull/20)
*--------------------------------------------------------------------------------------------*/

import * as vscode from "vscode";
import { NO_BOOKMARK_DEFINED } from "../core/constants";
import { Controller } from "../core/controller";
import { File } from "../core/file";
import { indexOfBookmark } from "../core/operations";

export function updateStickyBookmarks(event: vscode.TextDocumentChangeEvent,
    activeBookmark: File, activeEditor: vscode.TextEditor, controller: Controller): boolean {

    // no changes at all
    if (hasNoChanges(event)) {
        return false;
    }

    // added an empty, indented, line
    if (isAddEmptyLineWithIndent(event, activeBookmark, activeEditor, controller)) {
        return true;
    }

    // just a Move Line UP / Down
    if (isMoveLineUpDown(event, activeBookmark, activeEditor, controller)) {
        return true;
    }

    let updatedBookmark = false;
    const keepBookmarksOnLineDelete = vscode.workspace.getConfiguration("numberedBookmarks").get<boolean>("keepBookmarksOnLineDelete", false);

    // the NEW Sticky Engine
    for (const contentChangeEvent of event.contentChanges) {
        
        // didn't DEL neither ADD lines
        if (!isDeleteLine(contentChangeEvent) && !isAddLine(contentChangeEvent)) {
            continue;
        }

        if (isAddLine(contentChangeEvent)) {
            const numberOfLinesAdded = (contentChangeEvent.text.match(/\n/g) || []).length;

            for (let index = 0; index < activeBookmark.bookmarks.length; index++) {
                const eventLine: number = contentChangeEvent.range.start.line;
                let eventcharacter: number = contentChangeEvent.range.start.character;

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
                    const newLine = activeBookmark.bookmarks[ index ].line + numberOfLinesAdded;
                    activeBookmark.bookmarks[index].line = newLine;
                    updatedBookmark = true;
                }
            }
        }

        if (isDeleteLine(contentChangeEvent)) {

            // delete bookmarks INSIDE the deleted content 
            for (let i = contentChangeEvent.range.start.line; i < contentChangeEvent.range.end.line; i++) {
                const index = indexOfBookmark(activeBookmark, i); 

                if (index > -1) {
                    if (keepBookmarksOnLineDelete) {
                        const hasBookmarkAfterDeletionBlock = indexOfBookmark(activeBookmark, contentChangeEvent.range.end.line) > -1;
                        if (!hasBookmarkAfterDeletionBlock) {
                            const newLine = contentChangeEvent.range.end.line;
                            activeBookmark.bookmarks[index].line = newLine;
                        } else {
                            activeBookmark.bookmarks[index] = NO_BOOKMARK_DEFINED;
                        }
                    } else {
                        activeBookmark.bookmarks[index] = NO_BOOKMARK_DEFINED;
                    }
                    updatedBookmark = true;
                }
            }

            // move bookmarks UP
            const numberOfLinesDeleted = contentChangeEvent.range.end.line - contentChangeEvent.range.start.line;
            for (let index = 0; index < activeBookmark.bookmarks.length; index++) {
                // const element = activeBookmark.bookmarks[index];
                const eventLine: number = contentChangeEvent.range.start.line;
                let eventcharacter: number = contentChangeEvent.range.start.character;

                // indent ?
                if (eventcharacter > 0) {
                    let textInEventLine = activeEditor.document.lineAt(eventLine).text;
                    textInEventLine = textInEventLine.replace(/\t/g, "").replace(/\s/g, "");
                    if (textInEventLine === "") {
                        eventcharacter = 0;
                    }
                }
                if (
                    ((activeBookmark.bookmarks[ index ].line > eventLine) && (eventcharacter > 0)) ||
                    ((activeBookmark.bookmarks[ index ].line >= eventLine) && (eventcharacter === 0))
                ) {
                    const newLine = activeBookmark.bookmarks[ index ].line - numberOfLinesDeleted;
                    activeBookmark.bookmarks[index].line = newLine;
                    updatedBookmark = true;
                }
            }
        }
    }

    return updatedBookmark;
}

function isAddLine(contentChangeEvent: vscode.TextDocumentContentChangeEvent) {
    return contentChangeEvent.text.includes("\n");
}

function isDeleteLine(contentChangeEvent: vscode.TextDocumentContentChangeEvent) {
    return /* contentChangeEvent.text === "" &&  */(contentChangeEvent.range.start.line < contentChangeEvent.range.end.line);
}

function hasNoChanges(event: vscode.TextDocumentChangeEvent) {
    return event.contentChanges.length === 0;
}

function isAddEmptyLineWithIndent(event: vscode.TextDocumentChangeEvent, activeBookmark: File, activeEditor: vscode.TextEditor, controller: Controller) {
    if (event.contentChanges.length !== 2) {
        return false;
    }

    const firstEvent = event.contentChanges[0];
    const firstEventIsExpectation = (firstEvent.range.start.line === firstEvent.range.end.line &&
        firstEvent.range.start.character === firstEvent.range.end.character &&
        firstEvent.text.match(/\n/g).length > 0) 
    const secondEvent = event.contentChanges[1];
    const secondEventIsExpectation = (secondEvent.range.start.line === secondEvent.range.end.line &&
        secondEvent.range.start.character === 0 &&
        secondEvent.range.end.character !== 0 &&
        secondEvent.text === "");
    if (firstEventIsExpectation && secondEventIsExpectation) {
        return moveStickyBookmarks("up", secondEvent.range, activeBookmark, controller);
    } else {
        return false;
    }
}

function isMoveLineUpDown(event: vscode.TextDocumentChangeEvent, activeBookmark: File, activeEditor: vscode.TextEditor, controller: Controller) {
    
    // move line up and move line down 
    const moveChanges = event.contentChanges.filter(c => !(c.range.start.line === c.range.end.line && /^[\t ]*$/.test(c.text)));
    if (moveChanges.length === 2) {
        
        let updatedBookmark = false;

        // move line up and move line down case
        if (activeEditor.selections.length === 1) {
            if (moveChanges[ 0 ].text === "") {
                updatedBookmark = moveStickyBookmarks("down", moveChanges[ 1 ].range, activeBookmark, controller);
            } else if (moveChanges[ 1 ].text === "") {
                updatedBookmark = moveStickyBookmarks("up", moveChanges[ 0 ].range, activeBookmark, controller);
            }
        }
        return updatedBookmark;
    } 

    // not that stable yet
    // if (event.contentChanges.length > 1 && moveChanges.length === 1) {
    //     let updatedBookmark = false;
    //     if (activeEditor.selections.length === 1) {
    //         if (moveChanges[ 0 ].range.start.line === activeEditor.selections[0].start.line) {
    //             updatedBookmark = moveStickyBookmarks("up", moveChanges[ 0 ].range, activeBookmark, activeEditor, controller);
    //         } else {
    //             updatedBookmark = moveStickyBookmarks("down", moveChanges[ 0 ].range, activeBookmark, activeEditor, controller);
    //         }
    //     }
    //     return updatedBookmark;
    // }
    
    return false;
}

function moveStickyBookmarks(direction: string, range: vscode.Range, activeBookmark: File, controller: Controller): boolean {
    let diffChange = -1;
    let updatedBookmark = false;
    let diffLine;
    const selection = range;//activeEditor.selection;
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

    let indexRemoved: number;
    if (direction === "up") {
        diffLine = 1;

        indexRemoved = indexOfBookmark(activeBookmark, lineMin - 1);
        if (indexRemoved > -1) {
            diffChange = lineMax;
            activeBookmark.bookmarks[ indexRemoved ] = NO_BOOKMARK_DEFINED;
            updatedBookmark = true;
        }
    } else if (direction === "down") {
        diffLine = -1;

        indexRemoved = indexOfBookmark(activeBookmark, lineMax + 1);
        if (indexRemoved > -1) {
            diffChange = lineMin;
            activeBookmark.bookmarks[ indexRemoved ] = NO_BOOKMARK_DEFINED;
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
        if (index > -1) {
            activeBookmark.bookmarks[ index ].line -= diffLine;
            updatedBookmark = true;
        }
    }

    if (diffChange > -1 && indexRemoved)  {
        activeBookmark.bookmarks[ indexRemoved ] = {line: diffChange, column: 0};
        updatedBookmark = true;
    }

    return updatedBookmark;
}
