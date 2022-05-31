import { DropdownStepView, InfoStepView, StepFlow, StepFlowManager, CheckStepView, StepViewContainer, InputStepView, ButtonStepView, PromiseCompletionSource, TelemetryService } from 'diagnostic-data';
import { DiagProvider } from '../diag-provider';
import { NetworkCheckFlow } from "../network-check-flow"
import { ConnectivityStatusContract, ConnectivityStatusType, NetworkStatusContact } from './Contact/NetworkStatus';

function getWorstNetworkStatus(statuses: NetworkStatusContact[]) {
    return Math.max(...statuses.map(service => getWorstNetworkStatusOfLocation(service.networkStatus.connectivityStatus)));
}

function getWorstNetworkStatusOfLocation(statuses: ConnectivityStatusContract[]) {
    return Math.max(...statuses.map(service => rateConnectivityStatus(service.status)));
}

function rateConnectivityStatus(status: ConnectivityStatusType) {
    return [ConnectivityStatusType.Success, ConnectivityStatusType.Init, ConnectivityStatusType.Fail].findIndex(s => s == status);
}

function generateStatusMarkdownTable(statuses: ConnectivityStatusContract[]) {
    let table = `
    | Status | Name | Resource Group |
    | ------ | ---- | ------------- |
    `;

    for (let status of statuses) {
        table += `|   ${status.status} | ${status.name} | ${status.resourceType} |\n`;
    }

    return table;
}

async function getNetworkStatusView(diagProvider: DiagProvider, resoureceId) {
    // const networkStatusResponse = await diagProvider.getResource<NetworkStatusContact[]>(resoureceId + "/networkstatus", "2021-01-01-preview");
    // const networkStatuses = networkStatusResponse.body;
    const networkStatuses: any = [
        {
            "location": "West US",
            "networkStatus": {
                "dnsServers": [
                    "168.63.129.16"
                ],
                "connectivityStatus": [
                    {
                        "name": "https://gcs.prod.warm.ingestion.monitoring.azure.com",
                        "status": "failure",
                        "error": "",
                        "lastUpdated": "2022-05-27T23:14:22.8845352Z",
                        "lastStatusChange": "2022-05-19T06:56:42.5388027Z",
                        "resourceType": "Monitoring",
                        "isOptional": true
                    },
                    {
                        "name": "https://global.prod.microsoftmetrics.com/",
                        "status": "success",
                        "error": "",
                        "lastUpdated": "2022-05-27T23:15:02.2903526Z",
                        "lastStatusChange": "2022-05-19T06:56:42.6471303Z",
                        "resourceType": "Monitoring",
                        "isOptional": false
                    },
                    {
                        "name": "https://login.windows.net",
                        "status": "success",
                        "error": "",
                        "lastUpdated": "2022-05-27T23:15:17.7854174Z",
                        "lastStatusChange": "2022-05-19T07:11:24.5359641Z",
                        "resourceType": "AzureActiveDirectory",
                        "isOptional": true
                    },
                ]
            }
        },
        {
            "location": "East US",
            "networkStatus": {
                "dnsServers": [
                    "168.63.129.16"
                ],
                "connectivityStatus": [
                    {
                        "name": "dc.services.visualstudio.com",
                        "status": "success",
                        "error": "",
                        "lastUpdated": "2022-05-27T23:17:57.4183434Z",
                        "lastStatusChange": "2022-05-22T22:32:23.1687127Z",
                        "resourceType": "ApplicationInsightsIngestionEndpoint",
                        "isOptional": true
                    },
                    {
                        "name": "https://global.prod.microsoftmetrics.com/",
                        "status": "success",
                        "error": "",
                        "lastUpdated": "2022-05-27T23:18:03.2620214Z",
                        "lastStatusChange": "2022-05-22T22:32:22.7044581Z",
                        "resourceType": "Monitoring",
                        "isOptional": true
                    },
                    {
                        "name": "https://login.windows.net",
                        "status": "success",
                        "error": "",
                        "lastUpdated": "2022-05-27T23:18:49.695124Z",
                        "lastStatusChange": "2022-05-22T22:32:22.746829Z",
                        "resourceType": "AzureActiveDirectory",
                        "isOptional": true
                    },
                    {
                        "name": "https://prod3.prod.microsoftmetrics.com:1886/RecoveryService",
                        "status": "success",
                        "error": "",
                        "lastUpdated": "2022-05-27T23:18:22.6360112Z",
                        "lastStatusChange": "2022-05-22T22:16:35.1051766Z",
                        "resourceType": "Metrics",
                        "isOptional": true
                    },
                    {
                        "name": "LocalGatewayRedis",
                        "status": "success",
                        "error": "",
                        "lastUpdated": "2022-05-27T23:17:39.590723Z",
                        "lastStatusChange": "2022-05-22T22:32:22.7155782Z",
                        "resourceType": "InternalCache",
                        "isOptional": true
                    }
                ]
            }
        },
        {
            "location": "Central US",
            "networkStatus": {
                "dnsServers": [
                    "168.63.129.16"
                ],
                "connectivityStatus": [
                    {
                        "name": "apimstpam2qefxjewl0a7o1f.queue.core.windows.net",
                        "status": "failure",
                        "error": "",
                        "lastUpdated": "2022-05-27T23:17:29.3241243Z",
                        "lastStatusChange": "2022-05-25T09:46:31.9578619Z",
                        "resourceType": "Queue",
                        "isOptional": true
                    },
                    {
                        "name": "apimstpam2qefxjewl0a7o1f.table.core.windows.net",
                        "status": "success",
                        "error": "",
                        "lastUpdated": "2022-05-27T23:17:39.5841865Z",
                        "lastStatusChange": "2022-05-25T09:46:31.8977329Z",
                        "resourceType": "TableStorage",
                        "isOptional": false
                    },
                ]
            }
        }
    ];
    console.log(networkStatuses);
    const view = new CheckStepView({
        title: "Check DNS",
        level: getWorstNetworkStatus(networkStatuses),
        id: "firstStep",
        subChecks:
            networkStatuses.map(status => {
                let worstLocationStatus = getWorstNetworkStatusOfLocation(status.networkStatus.connectivityStatus);
                return {
                    title: status.location,
                    level: worstLocationStatus,
                    // subChecks: [{
                    //     title: generateStatusMarkdownTable(status.networkStatus.connectivityStatus),
                    //     level: getWorstNetworkStatusOfLocation(status.networkStatus.connectivityStatus)
                    // }]
                    bodyMarkdown: worstLocationStatus > 0 ? generateStatusMarkdownTable(status.networkStatus.connectivityStatus) : null,
                    // subChecks: status.networkStatus.connectivityStatus.map(status => {
                    //     return {
                    //         title: `(${status.resourceType}) ${status.name}`,
                    //         level: rateConnectivityStatus(status.status),
                    //         subChecks: null,
                    //         // detailsMarkdown: `
                    //         // | column1 | column2 |
                    //         // | ------- | ------- |
                    //         // | value1  | value2  |
                    //         // `
                    //     };
                    // }),
                    // detailsMarkdown: `detailsMarkdown in check which subChecks is not null will be ignored`
                }
            }),
    });

    return view;
}

export const DnsFlow: NetworkCheckFlow = {
    title: "DNS flow",
    id: "dnsFlow",

    // todo: generate custom payload that tests single errors for the different locations
    // todo make table more compact / concise


    func: async (siteInfo, diagProvider, flowMgr) => {
        const resoureceId = siteInfo.resourceUri;

        flowMgr.addView(getNetworkStatusView(diagProvider, resoureceId),  "running DNS checks");

    }
};