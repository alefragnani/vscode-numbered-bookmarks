/*---------------------------------------------------------------------------------------------
*  Copyright (c) Alessandro Fragnani. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { ChangeLogItem, ChangeLogKind, ContentProvider, Header, Image, Sponsor, IssueKind } from "../../vscode-whats-new/src/ContentProvider";

export class WhatsNewNumberedBookmarksContentProvider implements ContentProvider {

    public provideHeader(logoUrl: string): Header {
        return <Header> {logo: <Image> {src: logoUrl, height: 50, width: 50}, 
            message: `<b>Numbered Bookmarks</b> helps you to navigate in your code, <b>moving</b> 
            between important positions easily and quickly. No more need 
            to <i>search for code</i>. All of this in <b><i>Delphi style</i></b>`};
    }

    public provideChangeLog(): ChangeLogItem[] {
        const changeLog: ChangeLogItem[] = [];

        changeLog.push({ kind: ChangeLogKind.VERSION, detail: { releaseNumber: "7.1.0", releaseDate: "May 2020" } });

        changeLog.push({
            kind: ChangeLogKind.FIXED,
            detail: {
                message: "Navigation error on empty files",
                id: 60,
                kind: IssueKind.Issue
            }
        });
        changeLog.push({
            kind: ChangeLogKind.INTERNAL,
            detail: {
                message: "Support VS Code extension view context menu",
                id: 65,
                kind: IssueKind.Issue
            }
        });

        changeLog.push({ kind: ChangeLogKind.VERSION, detail: { releaseNumber: "7.0.0", releaseDate: "February 2020" } });
        changeLog.push({
            kind: ChangeLogKind.NEW,
            detail: {
                message: "Support <b>workbench.colorCustomizations</b>",
                id: 61,
                kind: IssueKind.Issue
            }
        });
        changeLog.push({
            kind: ChangeLogKind.INTERNAL,
            detail: {
                message: "Support VS Code package split",
                id: 62,
                kind: IssueKind.Issue
            }
        });
        changeLog.push({
            kind: ChangeLogKind.INTERNAL,
            detail: {
                message: "Use <b>vscode-ext-decoration</b> package",
                id: 64,
                kind: IssueKind.Issue
            }
        });

        changeLog.push({ kind: ChangeLogKind.VERSION, detail: { releaseNumber: "6.2.1", releaseDate: "May 2019" } });
        changeLog.push({
            kind: ChangeLogKind.FIXED,
            detail: {
                message: "Security Alert: tar",
                id: 55,
                kind: IssueKind.Issue
            }
        });

        return changeLog;
    }

    public provideSponsors(): Sponsor[] {
        const sponsors: Sponsor[] = [];
        return sponsors
    }
   
}