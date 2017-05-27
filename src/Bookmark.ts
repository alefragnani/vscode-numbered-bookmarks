"use strict";

import * as vscode from "vscode";
import fs = require("fs");

export const MAX_BOOKMARKS = 10;
export const NO_BOOKMARK_DEFINED = -1;

export class Bookmark {
    public fsPath: string;
    public bookmarks: number[];

    constructor(fsPath: string) {
        this.fsPath = fsPath;
        this.bookmarks = [];
        this.bookmarks.length = MAX_BOOKMARKS;
        this.clear();
    }

    public listBookmarks() {

        return new Promise((resolve, reject) => {

            if (this.bookmarks.length === 0) {
                resolve({});
                return;
            }

            if (!fs.existsSync(this.fsPath)) {
                resolve({});
                return;
            }

            let uriDocBookmark: vscode.Uri = vscode.Uri.file(this.fsPath);
            vscode.workspace.openTextDocument(uriDocBookmark).then(doc => {

                let items = [];
                let invalids = [];
                // for (let index = 0; index < this.bookmarks.length; index++) {
                //   let element = this.bookmarks[ index ];
                for (let element of this.bookmarks) {
                    // fix for modified files
                    if (element !== NO_BOOKMARK_DEFINED) {
                        if (element <= doc.lineCount) {
                            let lineText = doc.lineAt(element).text;
                            let normalizedPath = doc.uri.fsPath;
                            element++;
                            items.push({
                                label: element.toString(),
                                description: lineText,
                                detail: normalizedPath
                            });
                        } else {
                            invalids.push(element);
                        }
                    }
                }

                if (invalids.length > 0) {
                    // tslint:disable-next-line:prefer-for-of
                    for (let indexI = 0; indexI < invalids.length; indexI++) {
                        this.bookmarks[ invalids[ indexI ] ] = NO_BOOKMARK_DEFINED;
                    }
                }

                resolve(items);
                return;
            });
        });
    }
    
    public clear() {
        for (let index = 0; index < MAX_BOOKMARKS; index++) {
            this.bookmarks[ index ] = NO_BOOKMARK_DEFINED;
        }
    }
}
