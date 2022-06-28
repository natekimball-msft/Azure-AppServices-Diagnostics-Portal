import { checkResultLevel, CheckStepView, StepFlowManager } from 'diagnostic-data';
import { DiagProvider } from '../../diag-provider';
import { ConnectivityStatusContract, ConnectivityStatusType, NetworkStatusByLocationContract } from '../contracts/NetworkStatus';
import { statusIconMarkdown } from '../dnsFlow';

export const APIM_API_VERSION = "2021-12-01-preview";

function getWorstNetworkStatus(statuses: NetworkStatusByLocationContract[]): checkResultLevel {
    return getWorstStatus(statuses.map(service => getWorstNetworkStatusOfLocation(service.networkStatus.connectivityStatus)));
}
function getWorstNetworkStatusOfLocation(statuses: ConnectivityStatusContract[]): checkResultLevel {
    return getWorstStatus(statuses.map(service => rateConnectivityStatus(service)));
}

export function getWorstStatus(statuses: checkResultLevel[]) {
    let worst = checkResultLevel.pass;

    function rating(st: checkResultLevel) {
        return [
            checkResultLevel.error,
            checkResultLevel.fail,
            checkResultLevel.warning,
            checkResultLevel.info,
            checkResultLevel.loading,
            checkResultLevel.pass,
            checkResultLevel.hidden
        ].findIndex(s => s == st);
    }

    for (let status of statuses) {
        if (rating(status) < rating(worst))
            worst = status;
    }

    return worst;
}

function rateConnectivityStatus(status: ConnectivityStatusContract): checkResultLevel {
    switch (status.status) {
        case ConnectivityStatusType.Success: return checkResultLevel.pass;
        case ConnectivityStatusType.Init: return checkResultLevel.info;
        case ConnectivityStatusType.Fail: return status.isOptional ? checkResultLevel.warning : checkResultLevel.fail;
        default: return checkResultLevel.pass;
    }
}
function generateStatusMarkdownTable(statuses: ConnectivityStatusContract[]) {

    const len = 30;
    return `
    | Status | Name | Resource Group |
    |--------|------|----------------|
    ` + statuses.map(status => `|   ${statusIconMarkdown[rateConnectivityStatus(status)]} | ${status.name.length > len ? status.name.substring(0, len) + "..." : status.name} | ${status.resourceType} |`).join(`\n`);
}

async function getNetworkStatusView(diagProvider: DiagProvider, resourceId: string) {

    const networkStatusResponse = await diagProvider.getResource<NetworkStatusByLocationContract[]>(resourceId + "/networkstatus", APIM_API_VERSION);
    const networkStatuses = networkStatusResponse.body;
    const view = new CheckStepView({
        title: "Check Network Status",
        level: getWorstNetworkStatus(networkStatuses),
        id: "firstStep",
        subChecks: networkStatuses.map(status => {
            let worstLocationStatus = getWorstNetworkStatusOfLocation(status.networkStatus.connectivityStatus);
            return {
                title: status.location,
                level: worstLocationStatus,
                bodyMarkdown: generateStatusMarkdownTable(status.networkStatus.connectivityStatus),
            };
        }),
    });

    return view;
}
export function networkStatusCheck(flowMgr: StepFlowManager, diagProvider: DiagProvider, resourceId: any) {
    flowMgr.addView(getNetworkStatusView(diagProvider, resourceId), "Running network checks");
}
