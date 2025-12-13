/*---------------------------------------------------------------------------------------------
*  Copyright (c) Alessandro Fragnani. All rights reserved.
*  Licensed under the GPLv3 License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { Selection, Tab, TabInputText, TextEditorRevealType, Uri, ViewColumn, window, workspace } from "vscode";
import { Bookmark } from "../core/bookmark";
import { getRevealLocationConfig } from "./revealLocation";

export function revealLine(line: number, directJump?: boolean) {
    const newSe = new Selection(line, 0, line, 0);
    window.activeTextEditor.selection = newSe;
    window.activeTextEditor.revealRange(newSe, getRevealLocationConfig(directJump));
}

export function revealPosition(line: number, column: number): void {
    if (isNaN(column)) {
        revealLine(line);
    } else {
        const revealType: TextEditorRevealType = getRevealLocationConfig(line === window.activeTextEditor.selection.active.line);
        const newPosition = new Selection(line, column, line, column);
        window.activeTextEditor.selection = newPosition;
        window.activeTextEditor.revealRange(newPosition, revealType);
    }
}

export async function previewPositionInDocument(point: Bookmark, uri: Uri): Promise<void> {
    const textDocument = await workspace.openTextDocument(uri);
    await window.showTextDocument(textDocument, { preserveFocus: true, preview: true } );
    revealPosition(point.line - 1, point.column - 1);
}

export async function revealPositionInDocument(point: Bookmark, uri: Uri): Promise<void> {
    const tabGroupColumn = findTabGroupColumn(uri, window.activeTextEditor.viewColumn);

    const textDocument = await workspace.openTextDocument(uri);
    await window.showTextDocument(textDocument, tabGroupColumn, false);
    revealPosition(point.line, point.column);
}

function findTabGroupColumn(uri: Uri, column: ViewColumn): ViewColumn {
        if (window.tabGroups.all.length === 1) {
            return column;
        }

        for (const tab of window.tabGroups.activeTabGroup.tabs) {
            if (isTabOfUri(tab, uri)) {
                return tab.group.viewColumn;
            }
        }

        for (const tabGroup of window.tabGroups.all) {
            if (tabGroup.viewColumn === column) 
                continue;
            
            for (const tab of tabGroup.tabs) {
                if (isTabOfUri(tab, uri)) {
                    return tab.group.viewColumn;
                }
            }
        }

        return column;
    }

    function isTabOfUri(tab: Tab, uri: Uri): boolean {
        return tab.input instanceof TabInputText &&
                tab.input.uri.fsPath.toLocaleLowerCase() === uri.fsPath.toLocaleLowerCase()
    }
