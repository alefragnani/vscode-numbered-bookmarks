/*---------------------------------------------------------------------------------------------
*  Copyright (c) Alessandro Fragnani. All rights reserved.
*  Licensed under the GPLv3 License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { commands } from "vscode";
import { Container } from "../../vscode-numbered-bookmarks-core/src/container";
import { WhatsNewManager } from "../../vscode-whats-new/src/Manager";
import { NumberedBookmarksContentProvider, NumberedBookmarksSocialMediaProvider } from "./contentProvider";

export async function registerWhatsNew() {
    const provider = new NumberedBookmarksContentProvider();
    const viewer = new WhatsNewManager(Container.context)
        .registerContentProvider("alefragnani", "numbered-bookmarks", provider)
        .registerSocialMediaProvider(new NumberedBookmarksSocialMediaProvider());
    await viewer.showPageInActivation();
    Container.context.subscriptions.push(commands.registerCommand("numberedBookmarks.whatsNew", () => viewer.showPage()));
    Container.context.subscriptions.push(commands.registerCommand("numberedBookmarks.whatsNewContextMenu", () => viewer.showPage()));
}
