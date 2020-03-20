/*---------------------------------------------------------------------------------------------
*  Copyright (c) Alessandro Fragnani. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { ChangeLogItem, ChangeLogKind, ContentProvider, Header, Image, Sponsor } from "../../vscode-whats-new/src/ContentProvider";

export class WhatsNewNumberedBookmarksContentProvider implements ContentProvider {

    public provideHeader(logoUrl: string): Header {
        return <Header> {logo: <Image> {src: logoUrl, height: 50, width: 50}, 
            message: `<b>Numbered Bookmarks</b> helps you to navigate in your code, <b>moving</b> 
            between important positions easily and quickly. No more need 
            to <i>search for code</i>. All of this in <b><i>Delphi style</i></b>`};
    }

    public provideChangeLog(): ChangeLogItem[] {
        const changeLog: ChangeLogItem[] = [];
        changeLog.push({kind: ChangeLogKind.NEW, message: "<b>Multi-root</b> support"});
        changeLog.push({kind: ChangeLogKind.NEW, message: `Adds <b>workbench.colorCustomizations</b> support (<a title=\"Open Issue #61\" 
            href=\"https://github.com/alefragnani/vscode-numbered-bookmarks/issues/61\">
            Issue #61</a>)`});
        changeLog.push({kind: ChangeLogKind.NEW, message: `Settings to choose <b>gutter icon color</b> of 
            bookmarked lines (icon fill and number) (Thanks to @vasilev-alex - <a title=\"Open PR #45\" 
            href=\"https://github.com/alefragnani/vscode-numbered-bookmarks/pull/45\">
            PR #45</a>)`});
        changeLog.push({kind: ChangeLogKind.NEW, message: "Setting to choose how bookmarks <b>Navigate through all files</b>"});
        changeLog.push({kind: ChangeLogKind.FIXED, message: `Navigation error on empty files - 
            <a title=\"Issue #68\" href=\"https://github.com/alefragnani/vscode-numbered-bookmarks/issues/68\">
            Issue #68</a>)`});
        changeLog.push({kind: ChangeLogKind.FIXED, message: `Error activating extension without workspace - 
            <a title=\"Issue #35\" href=\"https://github.com/alefragnani/vscode-numbered-bookmarks/issues/35\">
            Issue #35</a>)`});
        return changeLog;
    }

    public provideSponsors(): Sponsor[] {
        const sponsors: Sponsor[] = [];
        return sponsors
    }
   
}