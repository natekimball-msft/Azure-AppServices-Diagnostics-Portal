export class UserSetting {
    public resources: RecentResource[];
    public id: string;
    public expandAnalysisCheckCard: boolean;

    constructor(id: string, resources: RecentResource[] = [], expandAnalysisCheckCard: boolean = false) {
        this.id = id;
        this.resources = resources;
        this.expandAnalysisCheckCard = expandAnalysisCheckCard;
    }


}

export interface RecentResource {
    kind: string;
    resourceUri: string;
    //Todo: starttime and endtime
}