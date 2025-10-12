/*---------------------------------------------------------------------------------------------
*  Copyright (c) Alessandro Fragnani. All rights reserved.
*  Licensed under the GPLv3 License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { Uri } from "vscode";
import { Bookmark } from "./bookmark";
import { MAX_BOOKMARKS } from "./constants";
import { clearBookmarks } from "./operations";

export interface File {
  path: string;
  bookmarks: Bookmark[];
  uri?: Uri;
}

export function createFile(filePath: string, uri?: Uri): File {
  const newFile: File = {
    path: filePath,
    bookmarks: [],
    uri
  } 
  newFile.bookmarks.length = MAX_BOOKMARKS;
  clearBookmarks(newFile);
  return newFile;
}
