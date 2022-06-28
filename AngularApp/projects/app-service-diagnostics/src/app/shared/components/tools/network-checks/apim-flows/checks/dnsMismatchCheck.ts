import { ButtonStepView, InfoStepView, InfoType, ResourceDescriptor, StepFlowManager } from 'diagnostic-data';
import { DiagProvider } from '../../diag-provider';
import { ApiManagementServiceResourceContract, VirtualNetworkType } from '../contracts/APIMService';
import { NetworkStatusByLocationContract } from '../contracts/NetworkStatus';
import { VirtualNetworkContract } from '../contracts/VirtualNetwork';
import { APIM_API_VERSION, NETWORK_API_VERSION } from '../dnsFlow';
import { Body } from './nsgCheck';

function getVnetResourceId(subnetResourceId: string): string {
    let uriDescriptor = ResourceDescriptor.parseResourceUri(subnetResourceId);
    return uriDescriptor.resource;
}
const DEFAULT_DNS = "168.63.129.16";
export async function dnsMismatchCheck(networkType: VirtualNetworkType, serviceResource: ApiManagementServiceResourceContract, flowMgr: StepFlowManager, diagProvider: DiagProvider, resourceId: any) {
    if (networkType != VirtualNetworkType.NONE) {
        const vnetResourceId = getVnetResourceId(serviceResource.properties.virtualNetworkConfiguration.subnetResourceId);

        const vnetResponse = await diagProvider.getResource<VirtualNetworkContract>(vnetResourceId, NETWORK_API_VERSION);
        const vnet = vnetResponse.body;

        const networkStatusResponse = await diagProvider.getResource<NetworkStatusByLocationContract[]>(resourceId + "/networkstatus", APIM_API_VERSION);
        const networkStatuses = networkStatusResponse.body;

        let validDNSs = vnet.properties.dhcpOptions.dnsServers;

        let invalidStatuses;
        if (validDNSs.length == 0) { // no custom dns specified
            // all dns have to be the default, which is 168.63.129.16
            invalidStatuses = networkStatuses.filter(status => status.networkStatus.dnsServers.some(dns => dns != DEFAULT_DNS));
        } else {
            invalidStatuses = networkStatuses.filter(status => status.networkStatus.dnsServers.some(dns => !validDNSs.includes(dns)));
        }

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
                        .postResourceAsync<ApiManagementServiceResourceContract, Body>(resourceId + "/applynetworkconfigurationupdates", {}, APIM_API_VERSION)
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
