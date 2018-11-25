import { ChangeLogItem, ChangeLogKind, Sponsor, ContentProvider, Header, Image } from "../../vscode-whats-new/src/ContentProvider";

export class WhatsNewNumberedBookmarksContentProvider implements ContentProvider {

    provideHeader(logoUrl: string): Header {
        return <Header>{logo: <Image> {src: logoUrl, height: 50, width: 50}, 
            message: `<b>Navigate</b> in your code, <b>moving</b> between important positions easily and 
            quickly, in <b>Delphi style</b>`};
    }

    provideChangeLog(): ChangeLogItem[] {
        let changeLog: ChangeLogItem[] = [];
        changeLog.push({kind: ChangeLogKind.NEW, message: "<b>Multi-root</b> support"});
        changeLog.push({kind: ChangeLogKind.NEW, message: `Setting to choose <b>background color</b> of 
            bookmarked files (Thanks to @ibraimgm - <a title=\"Open PR #44\" 
            href=\"https://github.com/alefragnani/vscode-numbered-bookmarks/pull/44\">
            PR #44</a>)</b>`});
        changeLog.push({kind: ChangeLogKind.NEW, message: "Setting to choose how bookmarks <b>Navigate through all files</b>"});
        changeLog.push({kind: ChangeLogKind.FIXED, message: `Error activating extension without workspace - 
            <a title=\"Issue #35\" href=\"https://github.com/alefragnani/vscode-numbered-bookmarks/issues/35\">
            Issue #35</a>)</b>`});
            return changeLog;
    }

    provideSponsors(): Sponsor[] {
        let sponsors: Sponsor[] = [];
        return sponsors
    }
   
}