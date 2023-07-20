/*---------------------------------------------------------------------------------------------
*  Copyright (c) Alessandro Fragnani. All rights reserved.
*  Licensed under the GPLv3 License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { ChangeLogItem, ChangeLogKind, ContentProvider, Header, Image, Sponsor, IssueKind, SupportChannel, SocialMediaProvider } from "../../vscode-whats-new/src/ContentProvider";

export class NumberedBookmarksContentProvider implements ContentProvider {
    public provideHeader(logoUrl: string): Header {
        return <Header> {logo: <Image> {src: logoUrl, height: 50, width: 50}, 
            message: `<b>Numbered Bookmarks</b> helps you to navigate in your code, <b>moving</b> 
            between important positions easily and quickly. No more need 
            to <i>search for code</i>. All of this in <b><i>Delphi style</i></b>`};
    }

    public provideChangeLog(): ChangeLogItem[] {
        const changeLog: ChangeLogItem[] = [];

        changeLog.push({ kind: ChangeLogKind.VERSION, detail: { releaseNumber: "8.4.0", releaseDate: "June 2023" } });
        changeLog.push({
            kind: ChangeLogKind.NEW,
            detail: {
                message: "Add <b>Getting Started/Walkthrough</b> support",
                id: 117,
                kind: IssueKind.Issue
            }
        });
        changeLog.push({
            kind: ChangeLogKind.NEW,
            detail: {
                message: "Add <b>Localization (l10n)</b> support",
                id: 151,
                kind: IssueKind.Issue
            }
        });
        changeLog.push({
            kind: ChangeLogKind.CHANGED,
            detail: {
                message: "Avoid What's New when using Gitpod",
                id: 168,
                kind: IssueKind.Issue
            }
        });
        changeLog.push({
            kind: ChangeLogKind.CHANGED,
            detail: {
                message: "Avoid What's New when installing lower versions",
                id: 168,
                kind: IssueKind.Issue
            }
        });
        changeLog.push({
            kind: ChangeLogKind.FIXED,
            detail: {
                message: "Repeated gutter icon on line wrap",
                id: 149,
                kind: IssueKind.Issue
            }
        });
        changeLog.push({
            kind: ChangeLogKind.INTERNAL,
            detail: {
                message: "Improve Startup speed",
                id: 145,
                kind: IssueKind.Issue
            }
        });
        changeLog.push({
            kind: ChangeLogKind.INTERNAL,
            detail: {
                message: "Security Alert: webpack",
                id: 156,
                kind: IssueKind.PR,
                kudos: "dependabot"
            }
        });
        changeLog.push({
            kind: ChangeLogKind.INTERNAL,
            detail: {
                message: "Security Alert: terser",
                id: 143,
                kind: IssueKind.PR,
                kudos: "dependabot"
            }
        });


        changeLog.push({ kind: ChangeLogKind.VERSION, detail: { releaseNumber: "8.3.1", releaseDate: "June 2022" } });
        changeLog.push({
            kind: ChangeLogKind.INTERNAL,
            detail: "Add <b>GitHub Sponsors</b> support"
        });

        changeLog.push({ kind: ChangeLogKind.VERSION, detail: { releaseNumber: "8.3.0", releaseDate: "April 2022" } });
        changeLog.push({
            kind: ChangeLogKind.NEW,
            detail: {
                message: "New setting to decide if should delete bookmark if associated line is deleted",
                id: 27,
                kind: IssueKind.Issue
            }
        });
        changeLog.push({
            kind: ChangeLogKind.NEW,
            detail: {
                message: "Update bookmark reference on file renames",
                id: 120,
                kind: IssueKind.Issue
            }
        });
        changeLog.push({
            kind: ChangeLogKind.CHANGED,
            detail: {
                message: "Replace custom icons with <i>on the fly</i> approach",
                id: 129,
                kind: IssueKind.Issue
            }
        });

        changeLog.push({ kind: ChangeLogKind.VERSION, detail: { releaseNumber: "8.2.0", releaseDate: "December 2021" } });
        changeLog.push({
            kind: ChangeLogKind.NEW,
            detail: {
                message: "New <b>Sticky Engine</b> with improved support to Formatters, Multi-cursor and Undo operations",
                id: 115,
                kind: IssueKind.Issue
            }
        });
        changeLog.push({
            kind: ChangeLogKind.CHANGED,
            detail: {
                message: "Removed deprecated setting <b>backgroundLineColor</b>",
                id: 116,
                kind: IssueKind.Issue
            }
        });
        changeLog.push({
            kind: ChangeLogKind.FIXED,
            detail: {
                message: "Bookmarks removes on Undo",
                id: 47,
                kind: IssueKind.Issue
            }
        });

        return changeLog;
    }

    public provideSupportChannels(): SupportChannel[] {
        const supportChannels: SupportChannel[] = [];
        supportChannels.push({
            title: "Become a sponsor on GitHub",
            link: "https://github.com/sponsors/alefragnani",
            message: "Become a Sponsor"
        });
        supportChannels.push({
            title: "Donate via PayPal",
            link: "https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=EP57F3B6FXKTU&lc=US&item_name=Alessandro%20Fragnani&item_number=vscode%20extensions&currency_code=USD&bn=PP%2dDonationsBF%3abtn_donate_SM%2egif%3aNonHosted",
            message: "Donate via PayPal"
        });
        return supportChannels;
    }
}

export class NumberedBookmarksSocialMediaProvider implements SocialMediaProvider {
    public provideSocialMedias() {
        return [{
            title: "Follow me on Twitter",
            link: "https://www.twitter.com/alefragnani"
        }];
    }
}