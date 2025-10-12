/*---------------------------------------------------------------------------------------------
*  Copyright (c) Alessandro Fragnani. All rights reserved.
*  Licensed under the GPLv3 License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import os = require("os");
import path = require("path");
import { Uri, WorkspaceFolder } from "vscode";
import { File } from "./file";
import { getFileUri, getRelativePath } from "./utils/fs";
import { createFile } from "./file";
import { isBookmarkDefined } from "./operations";
import { UNTITLED_SCHEME } from "./constants";

export class Controller {
        public files: File[];
        public workspaceFolder: WorkspaceFolder | undefined;

        constructor(workspaceFolder: WorkspaceFolder | undefined) {
            this.workspaceFolder = workspaceFolder;
            this.files = [];
        }

        public loadFrom(jsonObject, relativePath?) {
            if (jsonObject === "") {
                return;
            }

            // OLD format
            if ((jsonObject.bookmarks)) {
                const jsonBookmarks = jsonObject.bookmarks;
                // tslint:disable-next-line: prefer-for-of
                for (let idx = 0; idx < jsonBookmarks.length; idx++) {
                    const jsonBookmark = jsonBookmarks[ idx ];

                    // untitled files, ignore (for now)
                    const ff = <string>jsonBookmark.fsPath;
                    if (ff.match(/Untitled-\d+/)) {
                        continue;
                    }
                    
                    const file = relativePath
                        ? createFile(jsonBookmark.fsPath.replace(`$ROOTPATH$${path.sep}`, ""))
                        : createFile(getRelativePath(this.workspaceFolder?.uri?.fsPath, jsonBookmark.fsPath));

                    // Win32 uses `\\` but uris always uses `/`
                    if (os.platform() === "win32") {
                        file.path = file.path.replace(/\\/g, "/");
                    }

                    const bmksPosition = jsonBookmark.bookmarks.map(bmk => {
                        return {line: bmk, column: 0}
                    });
                    file.bookmarks = [
                        ...bmksPosition
                    ]
                    this.files.push(file);
                }
            } else { // NEW format
                for (const file of jsonObject.files) {

                    const bookmark = createFile(file.path);//??, file.uri ? <Uri>file.uri : undefined);
                    bookmark.bookmarks = [
                        ...file.bookmarks
                    ]
                    this.files.push(bookmark);
                }
            }        
        }

        public fromUri(uri: Uri) {
            if (uri.scheme === UNTITLED_SCHEME) {
                for (const file of this.files) {
                    if (file.uri?.toString() === uri.toString()) {
                        return file;
                    }
                }
                return;
            }
            
            const uriPath = !this.workspaceFolder 
                ? uri.path
                : getRelativePath(this.workspaceFolder.uri.path, uri.path);
            
            for (const file of this.files) {
                if (file.path === uriPath) {
                    return file;
                }
            }
        }

        public indexFromPath(filePath: string) {
            for (let index = 0; index < this.files.length; index++) {
                const file = this.files[index];

                if (file.path === filePath) {
                    return index;
                }
            }
        }

        public addFile(uri: Uri) {
            if (uri.scheme === UNTITLED_SCHEME) {
                // let foundFile: File;
                // for (const file of this.files) {
                //     if (file.uri?.toString() === uri.toString()) {
                //         foundFile = file;
                //     }
                // }

                // if (!foundFile) {
                    const file = createFile(uri.path, uri);
                    this.files.push(file);
                // }
                return;
            }

            const uriPath = !this.workspaceFolder 
                ? uri.path 
                : getRelativePath(this.workspaceFolder.uri.path, uri.path);

            const paths = this.files.map(file => file.path);
            if (paths.indexOf(uriPath) < 0) {
                const bookmark = createFile(uriPath);
                this.files.push(bookmark);
            }
        }

        public getFileUri(file: File) {
            return getFileUri(file, this.workspaceFolder);
        }

        public zip(): Controller {
            function isNotEmpty(book: File): boolean {
                let hasAny = false;
                for (const element of book.bookmarks) {
                    hasAny = isBookmarkDefined(element);
                    if (hasAny) {
                        break;
                    }
                }
                return hasAny;
            }

            function isValid(file: File): boolean {
                return !file.uri ; // Untitled files
            }

            function canBeSaved(file: File): boolean {
                return isValid(file) && isNotEmpty(file);
            }
            
            const newBookmarks: Controller = new Controller(this.workspaceFolder);
            newBookmarks.files = JSON.parse(JSON.stringify(this.files)).filter(canBeSaved);

            delete newBookmarks.workspaceFolder;

            return newBookmarks;
        }    
        
        public updateFilePath(oldFilePath: string, newFilePath: string): void {
            for (const file of this.files) {
                if (file.path === oldFilePath) {
                    file.path = newFilePath;
                    break;
                }
            }
        }

        public updateDirectoryPath(oldDirectoryPath: string, newDirectoryPath: string): void {
            for (const file of this.files) {
                if (file.path.startsWith(oldDirectoryPath)) {
                    file.path = file.path.replace(oldDirectoryPath, newDirectoryPath);
                }
            }
        }
    }
