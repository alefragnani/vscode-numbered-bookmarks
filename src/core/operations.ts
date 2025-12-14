/*---------------------------------------------------------------------------------------------
*  Copyright (c) Alessandro Fragnani. All rights reserved.
*  Licensed under the GPLv3 License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { Uri, workspace, WorkspaceFolder } from "vscode";
import { Bookmark, BookmarkQuickPickItem } from "./bookmark";
import { MAX_BOOKMARKS, NO_BOOKMARK_DEFINED } from "./constants";
import { uriExists } from "../utils/fs";
import { File } from "./file";

export function isBookmarkDefined(bookmark: Bookmark): boolean {
    return bookmark.line !== NO_BOOKMARK_DEFINED.line;
}

export function hasBookmarks(file: File): boolean {
    let hasAny = false;
    for (const element of file.bookmarks) {
        hasAny = isBookmarkDefined(element);
        if (hasAny) {
            break;
        }
    }
    return hasAny;
}

export function listBookmarks(file: File, workspaceFolder: WorkspaceFolder) {

    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async (resolve, reject) => {

        if (!hasBookmarks(file)) {
            resolve({});
            return;
        }

        let uriDocBookmark: Uri;
        if (file.uri) {
            uriDocBookmark = file.uri;
        } else {
            if (!workspaceFolder) {
                uriDocBookmark = Uri.file(file.path);
            } else {
                const prefix = workspaceFolder.uri.path.endsWith("/")
                    ? workspaceFolder.uri.path
                    : `${workspaceFolder.uri.path}/`;
                uriDocBookmark = workspaceFolder.uri.with({
                    path: `${prefix}/${file.path}`
                });
            }
        }

        if (! await uriExists(uriDocBookmark)) {
            resolve({});
            return;
        }

        workspace.openTextDocument(uriDocBookmark).then(doc => {

            const items: BookmarkQuickPickItem[] = [];
            const invalids = [];
            for (const element of file.bookmarks) {
                // fix for modified files
                if (isBookmarkDefined(element)) {
                    if (element.line <= doc.lineCount) {
                        const bookmarkLine = element.line + 1;
                        const bookmarkColumn = element.column + 1;
                        const lineText = doc.lineAt(bookmarkLine - 1).text.trim();
                        items.push({
                            label: lineText, 
                            description: "(Ln " + bookmarkLine.toString() + ", Col " + 
                                bookmarkColumn.toString() + ")",
                            detail: file.path,
                            uri: uriDocBookmark
                        });
                    } else {
                        invalids.push(element);
                    }
                }
            }

            if (invalids.length > 0) {
                // tslint:disable-next-line:prefer-for-of
                for (let indexI = 0; indexI < invalids.length; indexI++) {
                    file.bookmarks[ invalids[ indexI ] ] = NO_BOOKMARK_DEFINED;
                }
            }

            resolve(items);
            return;
        });
    });
}

export function clearBookmarks(file: File) {
    for (let index = 0; index < MAX_BOOKMARKS; index++) {
        file.bookmarks[ index ] = NO_BOOKMARK_DEFINED;
    }
}

export function indexOfBookmark(file: File, line: number): number {
    for (let index = 0; index < file.bookmarks.length; index++) {
        const bookmark = file.bookmarks[index];
        if (bookmark.line === line) {
            return index;
        }
    }
    return -1;
}
