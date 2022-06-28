import { DropdownStepView, InfoStepView, StepFlow, StepViewContainer, InputStepView, PromiseCompletionSource, TelemetryService, InfoType, StatusStyles } from 'diagnostic-data';
import { NetworkCheckFlow } from "../network-check-flow"
import { ApiManagementServiceResourceContract } from './contracts/APIMService';
import { SecurityRuleDirection } from './contracts/NetworkSecurity';
import { nsgRuleCheck } from './checks/nsgCheck';
import { routeTableCheck } from './checks/routeTableCheck';
import { dnsMismatchCheck } from './checks/dnsMismatchCheck';
import { networkStatusCheck } from './checks/networkStatusCheck';

export const APIM_API_VERSION = "2021-12-01-preview";
export const NETWORK_API_VERSION = "2021-08-01";

export let statusMarkdown = {
    0: `<i class="${StatusStyles.HealthyIcon}" style="width: 17px; height: 17px;"></i> Success`,
    1: `<i class="${StatusStyles.WarningIcon}" style="width: 17px; height: 17px;"></i> Warning`,
    2: `<i class="${StatusStyles.CriticalIcon}" style="width: 17px; height: 17px;"></i> Error`, // fail
};

export const DnsFlow: NetworkCheckFlow = {
    title: "Network Connectivity Check",
    id: "networkCheckFlow",

    func: async (siteInfo, diagProvider, flowMgr) => {
        
        /** Network Status Check */
        const resourceId = siteInfo.resourceUri;
        networkStatusCheck(flowMgr, diagProvider, resourceId);

        /** NSG Checks */
        const serviceResourceResponse = await diagProvider.getResource<ApiManagementServiceResourceContract>(resourceId, APIM_API_VERSION);
        let serviceResource = serviceResourceResponse.body;

        let networkType = serviceResource.properties.virtualNetworkType;
        nsgRuleCheck(networkType, flowMgr, diagProvider, serviceResource);

        /** DNS Mismatch Check */
        dnsMismatchCheck(networkType, serviceResource, flowMgr, diagProvider, resourceId);

        /** Route Table Check */
        routeTableCheck(networkType);

        flowMgr.addView(new InfoStepView({
            title: "Further Action",
            infoType: InfoType.diagnostic,
            id: "thirdStep",
            markdown: `
                Network status errors generally occur when the APIM service is not able to access external dependencies due to outages or traffic rules.
                Please check any error descriptions for further information.
            `
        }));

    }
};


