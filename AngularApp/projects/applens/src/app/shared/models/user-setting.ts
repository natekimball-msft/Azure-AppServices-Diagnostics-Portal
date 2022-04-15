export class UserSetting {
    public resources: RecentResource[];
    public id:string;
    public theme: string;
    public viewMode: string;
    public expandAnalysisCheckCard: boolean;

    constructor(id:string,resources: RecentResource[] = [], theme:string="light", viewMode: string="smarter", expandAnalysisCheckCard: boolean = false) {
        this.id = id;
        this.resources = resources;
        this.theme = theme;
        this.viewMode = viewMode;
        this.expandAnalysisCheckCard = expandAnalysisCheckCard;
    }


}

export interface RecentResource {
    kind: string;
    resourceUri: string;
    //Todo: starttime and endtime
}
