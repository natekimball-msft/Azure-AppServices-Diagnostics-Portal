import { InfoStepView, StepFlowManager, ButtonStepView, InfoType } from 'diagnostic-data';
import { DiagProvider } from '../../diag-provider';
import { ApiManagementServiceResource, VirtualNetworkType } from '../contracts/APIMService';
import { NetworkStatusContractByLocation } from '../contracts/NetworkStatus';
import { VirtualNetwork } from '../contracts/VirtualNetwork';
import { Body } from './nsgCheck';
import { NETWORK_API_VERSION, APIM_API_VERSION } from '../dnsFlow';

function getVnetResourceId(subnetResourceId: string): string {
    return subnetResourceId.split("/subnets/")[0];
}
export async function dnsMismatchCheck(networkType: VirtualNetworkType, serviceResource: ApiManagementServiceResource, flowMgr: StepFlowManager, diagProvider: DiagProvider, resourceId: any) {
    if (networkType != VirtualNetworkType.NONE) {
        const vnetResourceId = getVnetResourceId(serviceResource.properties.virtualNetworkConfiguration.subnetResourceId);

        const vnetResponse = await diagProvider.getResource<VirtualNetwork>(vnetResourceId, NETWORK_API_VERSION);
        const vnet = vnetResponse.body;

        const networkStatusResponse = await diagProvider.getResource<NetworkStatusContractByLocation[]>(resourceId + "/networkstatus", APIM_API_VERSION);
        const networkStatuses = networkStatusResponse.body;

        let validDNSs = vnet.properties.dhcpOptions.dnsServers;

        let invalidStatuses = networkStatuses.filter(status => status.networkStatus.dnsServers.some(dns => validDNSs.includes(dns)));

        invalidStatuses.push({
            location: '',
            networkStatus: undefined
        });
        console.log("invalid statuses", validDNSs, networkStatuses);


        if (invalidStatuses.length > 0) {
            flowMgr.addView(new InfoStepView({
                title: "DNS Network Configuration Needs to be Updated",
                id: "step4",
                infoType: InfoType.diagnostic,
                markdown: "There seems to be some issue with the DNS settings of your APIM service. Plase click the button below to refresh your DNS configuration."
            }));
            flowMgr.addView(new ButtonStepView({
                callback: () => {
                    return diagProvider
                        .postResourceAsync<ApiManagementServiceResource, Body>(resourceId + "/applynetworkconfigurationupdates", {}, APIM_API_VERSION)
                        .then(() => { });
                },
                id: "step4",
                text: "Apply Network Configuration"
            }));
        } else {
            flowMgr.addView(new InfoStepView({
                title: "DNS Healthy",
                id: "step4",
                infoType: InfoType.recommendation,
                markdown: "DNS looks healthy!"
            }));
        }
    } else {
    }
}
