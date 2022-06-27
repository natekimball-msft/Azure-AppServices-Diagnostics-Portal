export class DevopsConfig{
    organization: string = "";
    repository: string = "";
    folderPath: string = "";
    project: string = "";
    appTypeReviewers = {};
    platformReviewers = {};
    resourceProvider: string = "";
    autoMerge: boolean = false;
    internalPassthrough: boolean = false;


    constructor(devopsConfig: any){
        this.organization = devopsConfig.organization;
        this.repository = devopsConfig.repository;
        this.folderPath = devopsConfig.folderPath;
        this.project = devopsConfig.project;
        if (!!devopsConfig.reviewers) {
            Object.keys(devopsConfig.reviewers[0].platformtype).forEach(platRev => {
                this.platformReviewers[platRev] = devopsConfig.reviewers[0].platformtype[platRev];
            });
            Object.keys(devopsConfig.reviewers[1].apptype).forEach(appRev => {
                this.appTypeReviewers[appRev] = devopsConfig.reviewers[1].apptype[appRev];
            });
        }
        this.resourceProvider = devopsConfig.resourceProvider;
        this.autoMerge = devopsConfig.autoMerge;
        if(!!devopsConfig.internalPassthrough) this.internalPassthrough = devopsConfig.internalPassthrough;
    }
}

