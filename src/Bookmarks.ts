/*---------------------------------------------------------------------------------------------
*  Copyright (c) Alessandro Fragnani. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

"use strict";

import * as vscode from "vscode";
import {Bookmark, NO_BOOKMARK_DEFINED} from "./Bookmark";

export class Bookmarks {
        public bookmarks: Bookmark[];

        constructor() {
            this.bookmarks = [];
        }

        public loadFrom(jsonObject, relativePath?) {
            if (jsonObject === "") {
                return;
            }
            
            let jsonBookmarks = jsonObject.bookmarks;
            for (let idx = 0; idx < jsonBookmarks.length; idx++) {
              let jsonBookmark = jsonBookmarks[idx];
              
              // each bookmark (line)
              this.add(jsonBookmark.fsPath);
              for (let index = 0; index < jsonBookmark.bookmarks.length; index++) {
                  this.bookmarks[idx].bookmarks[index] = jsonBookmark.bookmarks[index];
              }
            }
            
            if (relativePath) {
                for (let element of this.bookmarks) {
                    element.fsPath = element.fsPath.replace("$ROOTPATH$", vscode.workspace.workspaceFolders[0].uri.fsPath);
                }
            }            
        }

        public fromUri(uri: string) {
            for (let element of this.bookmarks) {
                if (element.fsPath === uri) {
                    return element;
                }
            }
        }

        public indexFromUri(uri: string) {
            for (let index = 0; index < this.bookmarks.length; index++) {
                let element = this.bookmarks[index];

                if (element.fsPath === uri) {
                    return index;
                }
            }
        }

        public add(uri: string) {
            let existing: Bookmark = this.fromUri(uri);
            if (typeof existing === "undefined") {
                let bookmark = new Bookmark(uri);
                this.bookmarks.push(bookmark);
            }
        }

        public zip(relativePath?: boolean): Bookmarks {
            function isNotEmpty(book: Bookmark): boolean {
                let hasAny: boolean = false;
                for (let element of book.bookmarks) {
                    hasAny = element !== NO_BOOKMARK_DEFINED;
                    if (hasAny) {
                        break;
                    }
                }
                return hasAny;
            }
            
            let newBookmarks: Bookmarks = new Bookmarks();
            newBookmarks.bookmarks = JSON.parse(JSON.stringify(this.bookmarks)).filter(isNotEmpty);

            if (!relativePath) {
                return newBookmarks;
            }

            for (let element of newBookmarks.bookmarks) {
                element.fsPath = element.fsPath.replace(vscode.workspace.getWorkspaceFolder(
                    vscode.Uri.file(element.fsPath)).uri.fsPath, "$ROOTPATH$");
            }
            return newBookmarks;
        }        
    }
