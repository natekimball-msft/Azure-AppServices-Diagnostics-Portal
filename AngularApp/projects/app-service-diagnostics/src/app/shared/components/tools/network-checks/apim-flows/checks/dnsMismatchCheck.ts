import { ButtonStepView, InfoStepView, InfoType, ResourceDescriptor, StepFlowManager } from 'diagnostic-data';
import { DiagProvider } from '../../diag-provider';
import { ApiManagementServiceResourceContract, VirtualNetworkConfigurationContract, VirtualNetworkType } from '../contracts/APIMService';
import { NetworkStatusByLocationContract } from '../contracts/NetworkStatus';
import { VirtualNetworkContract } from '../contracts/VirtualNetwork';
import { APIM_API_VERSION, NETWORK_API_VERSION } from "../data/constants";
import { Body } from './nsgCheck';

function getVnetResourceId(subnetResourceId: string): string {
    let uriDescriptor = ResourceDescriptor.parseResourceUri(subnetResourceId);
    return uriDescriptor.resource;
}

async function getInvalidDnsByVNet(
    virtualNetworkConfiguration: VirtualNetworkConfigurationContract, 
    diagProvider: DiagProvider, 
    networkStatuses: NetworkStatusByLocationContract[]): Promise<NetworkStatusByLocationContract[]> {
    const vnetResourceId = getVnetResourceId(virtualNetworkConfiguration.subnetResourceId);

    const vnetResponse = await diagProvider.getResource<VirtualNetworkContract>("/" + vnetResourceId, NETWORK_API_VERSION);
    const vnet = vnetResponse.body;

    let validDNSs = vnet.properties.dhcpOptions.dnsServers;

    let invalidStatuses: NetworkStatusByLocationContract[];
    if (validDNSs.length == 0) { // no custom dns specified
        // all dns have to be the default, which is 168.63.129.16
        invalidStatuses = networkStatuses.filter(
            status => status.networkStatus.dnsServers.some(
                dns => dns != DEFAULT_DNS));
    } else {
        invalidStatuses = networkStatuses.filter(
            status => status.networkStatus.dnsServers.some(
                dns => !validDNSs.includes(dns)));
    }

    invalidStatuses.push({
        location: '',
        networkStatus: undefined
    });

    console.log("status", invalidStatuses);
    return invalidStatuses;
}


const DEFAULT_DNS = "168.63.129.16";
export async function dnsMismatchCheck(
    networkType: VirtualNetworkType, 
    serviceResource: ApiManagementServiceResourceContract, 
    flowMgr: StepFlowManager, 
    diagProvider: DiagProvider, 
    resourceId: string) {
    if (networkType != VirtualNetworkType.NONE) {

        const networkStatusResponse = await diagProvider.getResource<NetworkStatusByLocationContract[]>(resourceId + "/networkstatus", APIM_API_VERSION);
        const networkStatuses = networkStatusResponse.body;

        let invalidStatusByLocation: {[key: string]: NetworkStatusByLocationContract[]} = {};

        // should move await calls into Promise.all for good parallelism
        invalidStatusByLocation[serviceResource.location] = await getInvalidDnsByVNet(serviceResource.properties.virtualNetworkConfiguration, diagProvider, networkStatuses);

        for (let loc of serviceResource.properties.additionalLocations) {
            invalidStatusByLocation[loc.location] = await getInvalidDnsByVNet(loc.virtualNetworkConfiguration, diagProvider, networkStatuses);
        }

        // await Promise.all(Object.keys(invalidStatusByLocation).map(loc => invalidStatusByLocation[loc]));

        // if any location has an invalid status
        if (Object.values(invalidStatusByLocation).some(stat => stat.length > 0)) {
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

