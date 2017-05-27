"use strict";

import * as vscode from "vscode";
import fs = require("fs");
import {Bookmark, MAX_BOOKMARKS, NO_BOOKMARK_DEFINED} from "./Bookmark";

export class Bookmarks {
        bookmarks: Bookmark[];

        constructor() {
            this.bookmarks = [];
        }

        public loadFrom(jsonObject, relativePath?) {
            if (jsonObject == '') {
                return;
            }
            
            let jsonBookmarks = jsonObject.bookmarks;
            for (var idx = 0; idx < jsonBookmarks.length; idx++) {
              let jsonBookmark = jsonBookmarks[idx];
              
              // each bookmark (line)
              this.add(jsonBookmark.fsPath);
              for (let index = 0; index < jsonBookmark.bookmarks.length; index++) {
                  this.bookmarks[idx].bookmarks[index] = jsonBookmark.bookmarks[index];
              }
            }
            
            if (relativePath) {
                for (let element of this.bookmarks) {
                    element.fsPath = element.fsPath.replace("$ROOTPATH$", vscode.workspace.rootPath);
                }
            }            
        }

        fromUri(uri: string) {
            for (var index = 0; index < this.bookmarks.length; index++) {
                var element = this.bookmarks[index];

                if (element.fsPath == uri) {
                    return element;
                }
            }
        }

        indexFromUri(uri: string) {
            for (var index = 0; index < this.bookmarks.length; index++) {
                var element = this.bookmarks[index];

                if (element.fsPath == uri) {
                    return index;
                }
            }
        }

        add(uri: string) {
            let existing: Bookmark = this.fromUri(uri);
            if (typeof existing == 'undefined') {
                var bookmark = new Bookmark(uri);
                this.bookmarks.push(bookmark);
            }
        }

        zip(relativePath?: boolean): Bookmarks {
            function isNotEmpty(book: Bookmark): boolean {
                let hasAny: boolean = false;
                for (let index = 0; index < book.bookmarks.length; index++) {
                    let element = book.bookmarks[index];
                    hasAny = element != NO_BOOKMARK_DEFINED;
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
                element.fsPath = element.fsPath.replace(vscode.workspace.rootPath, "$ROOTPATH$");
            }
            return newBookmarks;
        }        
    }
