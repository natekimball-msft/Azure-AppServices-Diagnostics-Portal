import { StepFlowManager } from "diagnostic-data";
import { Site, SiteInfoMetaData } from "../../../models/site";
import { DiagProvider } from "./diag-provider";

export interface NetworkCheckFlow {
    id: string;
    title: string;
    description?: string;
    func(siteInfo: SiteInfoMetaData & Site & { fullSiteName: string }, diagProvider: DiagProvider, flowMgr: StepFlowManager): Promise<null>;
}