export class DevopsConfig{
    organization: string = "";
    repository: string = "";
    folderPath: string = "";
    project: string = "";

    constructor(devopsConfig: any){
        this.organization = devopsConfig.organization;
        this.repository = devopsConfig.repository;
        this.folderPath = devopsConfig.folderPath;
        this.project = devopsConfig.project;
    }
}

