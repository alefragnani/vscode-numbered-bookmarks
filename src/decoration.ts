/*---------------------------------------------------------------------------------------------
*  Copyright (c) Alessandro Fragnani. All rights reserved.
*  Licensed under the GPLv3 License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { DecorationRenderOptions, OverviewRulerLane, Range, TextEditor, TextEditorDecorationType, ThemeColor, Uri, workspace, window } from "vscode";
import { createLineDecoration } from "vscode-ext-decoration";
import { DEFAULT_GUTTER_ICON_NUMBER_COLOR, DEFAULT_GUTTER_ICON_FILL_COLOR, MAX_BOOKMARKS, NO_BOOKMARK_DEFINED } from "../vscode-numbered-bookmarks-core/src/constants";
import { File } from "../vscode-numbered-bookmarks-core/src/file";
import { clearBookmarks } from "../vscode-numbered-bookmarks-core/src/operations";

function createGutterRulerDecoration(
    overviewRulerLane?: OverviewRulerLane,
    overviewRulerColor?: string | ThemeColor,
    gutterIconPath?: string | Uri): TextEditorDecorationType {

    const decorationOptions: DecorationRenderOptions = {
        gutterIconPath,
        overviewRulerLane,
        overviewRulerColor
    };

    decorationOptions.isWholeLine = false;

    return window.createTextEditorDecorationType(decorationOptions);
}

export type TextEditorDecorationTypePair = [TextEditorDecorationType, TextEditorDecorationType];

export function createBookmarkDecorations(): TextEditorDecorationTypePair[] {
    const decorators: TextEditorDecorationTypePair[] = [];
    for (let number = 0; number <= 9; number++) {
        const iconFillColor = workspace.getConfiguration("numberedBookmarks").get("gutterIconFillColor", DEFAULT_GUTTER_ICON_FILL_COLOR);
        const iconNumberColor = workspace.getConfiguration("numberedBookmarks").get("gutterIconNumberColor", DEFAULT_GUTTER_ICON_NUMBER_COLOR);
        const iconPath = Uri.parse(
            `data:image/svg+xml,${encodeURIComponent(
                `<svg xmlns="http://www.w3.org/2000/svg"> <g fill="none" fill-rule="evenodd" stroke="none" stroke-width="1"> <g fill="${iconFillColor}" stroke="null"><path d="M5.573914546804859,0.035123038858889274 C4.278736002284275,0.035123038858889274 3.228793828301391,0.9189688905396587 3.228793828301391,2.005394862080541 L3.228793828301391,15.844184705765102 L7.923495246522241,11.89191599548129 L12.618212313799981,15.844184705765102 L12.618212313799981,2.005394862080541 C12.618212313799981,0.9172430665361684 11.56845792849979,0.035123038858889274 10.273075946239627,0.035123038858889274 L5.573898897747966,0.035123038858889274 L5.573914546804859,0.035123038858889274 z" stroke="null"></path></g> </g> <text text-anchor="middle" alignment-baseline="middle" x="7.6" y="7.5" fill="${iconNumberColor}" font-weight="bold" font-size="9" font-family="Menlo, Monaco, monospace">${number}</text> </svg>`,
            )}`,
        );
        
        const overviewRulerColor = new ThemeColor('numberedBookmarks.overviewRuler');
        const lineBackground = new ThemeColor('numberedBookmarks.lineBackground');
        const lineBorder = new ThemeColor('numberedBookmarks.lineBorder');

        const gutterDecoration = createGutterRulerDecoration(OverviewRulerLane.Full, overviewRulerColor, iconPath);
        const lineDecoration = createLineDecoration(lineBackground, lineBorder);
        decorators.push([gutterDecoration, lineDecoration]);
        // decorators.push(createLineDecoration(lineBackground, lineBorder, OverviewRulerLane.Full, overviewRulerColor, iconPath));
    }
    return decorators;
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
        clearBookmarks(activeBookmark);
    } else {
        const invalids = [];
        for (let index = 0; index < MAX_BOOKMARKS; index++) {
            books = [];
            if (activeBookmark.bookmarks[ index ].line < 0) {
                const decors = getDecoration(index);
                activeEditor.setDecorations(decors[0], books);
                activeEditor.setDecorations(decors[1], books);
            } else {
                const element = activeBookmark.bookmarks[ index ];
                if (element.line < activeEditor.document.lineCount) {
                    const decoration = new Range(element.line, 0, element.line, 0);
                    books.push(decoration);
                    const decors = getDecoration(index);
                    activeEditor.setDecorations(decors[1], books);
                    activeEditor.setDecorations(decors[0], books);
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