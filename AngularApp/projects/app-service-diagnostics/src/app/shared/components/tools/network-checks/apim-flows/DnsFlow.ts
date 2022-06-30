import { InfoStepView, InfoType } from 'diagnostic-data';
import { NetworkCheckFlow } from "../network-check-flow";
import { APIM_API_VERSION } from './data/constants';
import { dnsMismatchCheck } from './checks/dnsMismatchCheck';
import { networkStatusCheck } from './checks/networkStatusCheck';
import { nsgRuleCheck } from './checks/nsgCheck';
import { routeTableCheck } from './checks/routeTableCheck';
import { ApiManagementServiceResourceContract } from './contracts/APIMService';

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


