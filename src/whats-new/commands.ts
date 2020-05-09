/*---------------------------------------------------------------------------------------------
*  Copyright (c) Alessandro Fragnani. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { commands } from "vscode";
import { Container } from "../../vscode-numbered-bookmarks-core/src/container";
import { WhatsNewManager } from "../../vscode-whats-new/src/Manager";
import { WhatsNewNumberedBookmarksContentProvider } from "./contentProvider";

export function registerWhatsNew() {
    const provider = new WhatsNewNumberedBookmarksContentProvider();
    const viewer = new WhatsNewManager(Container.context).registerContentProvider("numbered-bookmarks", provider);
    viewer.showPageInActivation();
    Container.context.subscriptions.push(commands.registerCommand("numberedBookmarks.whatsNew", () => viewer.showPage()));
    Container.context.subscriptions.push(commands.registerCommand("numberedBookmarks.whatsNewContextMenu", () => viewer.showPage()));
}
