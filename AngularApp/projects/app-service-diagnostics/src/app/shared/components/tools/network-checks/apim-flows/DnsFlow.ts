import { DropdownStepView, InfoStepView, StepFlow, StepFlowManager, CheckStepView, StepViewContainer, InputStepView, ButtonStepView, PromiseCompletionSource, TelemetryService, checkResultLevel, InfoType, StatusStyles } from 'diagnostic-data';
import { stat } from 'fs';
import { Check, themeRulesStandardCreator } from 'office-ui-fabric-react';
import { isArray } from 'util';
import { DiagProvider } from '../diag-provider';
import { NetworkCheckFlow } from "../network-check-flow"
import { ApiManagementServiceResource, PlatformVersion, VirtualNetworkType } from './Contract/APIMService';
import { NetworkSecurityGroup, ProvisioningState, SecurityRule, SecurityRuleAccess, SecurityRuleDirection, SecurityRuleProtocol, Subnet } from './Contract/NetworkSecurity';
import { ConnectivityStatusContract, ConnectivityStatusType, NetworkStatusContractByLocation } from './Contract/NetworkStatus';
import {stv2portRequirements, stv1portRequirements, PortRequirements } from './data/portRequirements';

const APIM_API_VERSION = "2021-12-01-preview";
const NETWORK_API_VERSION = "2021-08-01";

function getWorstNetworkStatus(statuses: NetworkStatusContractByLocation[]): checkResultLevel {
    return getWorstStatus(statuses.map(service => getWorstNetworkStatusOfLocation(service.networkStatus.connectivityStatus)));
}

function getWorstNetworkStatusOfLocation(statuses: ConnectivityStatusContract[]): checkResultLevel {
    return getWorstStatus(statuses.map(service => rateConnectivityStatus(service)));
}

function getWorstStatus(statuses: checkResultLevel[]) {
    let worst = checkResultLevel.pass;

    function rating(st: checkResultLevel) {
        return [
            checkResultLevel.error, 
            checkResultLevel.fail, 
            checkResultLevel.warning, 
            checkResultLevel.info, 
            checkResultLevel.loading, 
            checkResultLevel.pass, 
            checkResultLevel.hidden].findIndex(s => s == st);        
    }

    for (let status of statuses) {
        if (rating(status) < rating(worst)) worst = status;
    }

    return worst;
}

function rateConnectivityStatus(status: ConnectivityStatusContract): checkResultLevel {

    switch(status.status) {
        case ConnectivityStatusType.Success:    return checkResultLevel.pass;
        case ConnectivityStatusType.Init:       return checkResultLevel.info;
        case ConnectivityStatusType.Fail:       return status.isOptional ? checkResultLevel.warning : checkResultLevel.fail;
        default: return checkResultLevel.pass;
    }
    
}

async function getNetworkStatusView(diagProvider: DiagProvider, resoureceId: string) {
    
    const networkStatusResponse = await diagProvider.getResource<NetworkStatusContractByLocation[]>(resoureceId + "/networkstatus", APIM_API_VERSION);
    const networkStatuses = networkStatusResponse.body;
    const view = new CheckStepView({
        title: "Check Network Status",
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
                    bodyMarkdown: generateStatusMarkdownTable(status.networkStatus.connectivityStatus),
                    // subChecks: status.networkStatus.connectivityStatus.map(status => {
                    //     return {
                    //         title: `<table><tr><td>${status.name}</td><td>${status.resourceType}</td></tr></table>`,
                    //         level: rateConnectivityStatus(status),
                            
                    //         bodyMarkdown: status.error,
                            
                    //     };
                    // }),
                    
                }
            }),
    });

    return view;
}


// class CIDRBlock {
//     bitAddress: number;
//     prefix: number;

//     toBits(a: string, b: string, c: string, d: string): number {
//         let [o1, o2, o3, o4] = [parseInt(a), parseInt(b), parseInt(c), parseInt(d)];
//         return o1 << 24 | o2 << 16 | o3 << 8 | o4;
//     }

//     constructor(address: string) {
//         if (address == "*") {
//             this.bitAddress = 0;
//             this.prefix = 0;
//         } else {
//             let [a, b, c, dp] = address.split(".");
//             let [d, p] = dp.split("/");
//             this.bitAddress = this.toBits(a, b, c, d);
//             this.prefix = parseInt(p);
//         }
//     }

//     qualifies(address: string): boolean {
//         let [a, b, c, d] = address.split(".");
//         let bitAddr = this.toBits(a, b, c, d);
//         return (this.bitAddress >> (32 - this.prefix)) == (bitAddr >> (32 - this.prefix));
//     }
// }

// class IPBlock {
//     a: number;
//     b: number;
//     c: number;
//     d: number;

//     constructor(address: string) {
//         if (address == "*") {
//             this.a = -1;
//             this.b = -1;
//             this.c = -1;
//             this.d = -1;
//         } else {
//             let [a, b, c, d] = address.split(".");
//             this.a = a == "*" ? -1 : parseInt(a);
//             this.b = b == "*" ? -1 : parseInt(b);
//             this.c = c == "*" ? -1 : parseInt(c);
//             this.d = d == "*" ? -1 : parseInt(d);
//         }
//     }

//     qualifies(address: string): boolean {
//         return false;
//     }
// }

class PortRange {
    port1: number;
    port2: number | null;

    constructor(ports: string) {
        if (ports == "*") {
            this.port1 = 0;
            this.port2 = 65536;
        } else if (ports.includes("-")) {
            let [p1, p2] = ports.split("-");
            this.port1 = parseInt(p1);
            this.port2 = parseInt(p2);
        } else {
            this.port1 = parseInt(ports);
            this.port2 = null;
        }
    }

    has(port: number) {
        if (this.port2) {
            return this.port1 <= port && port < this.port2;
        } else {
            return port == this.port1;
        }
    }
}

// use
// html itag - used to render some icon
// table component in applense

function sameProtocol(protocol1: SecurityRuleProtocol, protocol2: SecurityRuleProtocol) {
    return protocol1 == SecurityRuleProtocol.AST || protocol2 == SecurityRuleProtocol.AST || protocol1 == protocol2;
}

function samePorts(port: number | number[], pRange: string) {
    let destinationPortRange = new PortRange(pRange);
    let ports = [].concat(port);
    return !ports.some((n) => destinationPortRange.has(n));
}

function sameIP(ip1: string, ip2: string) {
    return ip1 == "*" || ip2 == "*" || ip1 == "Any" || ip2 == "Any" || ip1 == ip2 || 
        (ip1 == "Internet" && ip2 != "VirtualNetwork") || (ip1 != "VirtualNetwork" && ip2 == "Internet");
}

function has(arr: [] | Object, val: Object) {
    if (Array.isArray(val)) {
        return (arr as Array<Object>).includes(val);
    } else {
        return arr == val;
    }
}

function rulePassed(requirement: PortRequirements, rule: SecurityRule) {
    if (rule.properties.access == SecurityRuleAccess.ALLOW)                 return true;
    if (rule.properties.provisioningState != ProvisioningState.SUCCEEDED)   return true;
    
    // do vnet type check outside here!
    if (!has(requirement.dir, rule.properties.direction))                   return false;
    if (!sameProtocol(requirement.protocol, rule.properties.protocol))      return false;

    if (!samePorts(requirement.num, rule.properties.destinationPortRange))  return true;
    return sameIP(requirement.serviceSource, rule.properties.sourceAddressPrefix) 
        && sameIP(requirement.serviceDestination, rule.properties.destinationAddressPrefix);
}


interface RequirementResult {
    status: checkResultLevel;
    name: string;
    description: string;
}

function requirementCheck(requirements: PortRequirements[], rules: SecurityRule[], networkSecurityGroupResourceId: string): RequirementResult[] {
    let failedChecks: RequirementResult[] = [];
    
    requirements.forEach(req => {
        let failedRule = rules.find(r => !rulePassed(req, r));
        
        if (failedRule != undefined) {
            failedChecks.push({
                status: req.required ? checkResultLevel.fail : checkResultLevel.warning,
                name: `Security rule <b>${failedRule.name}</b> is blocking access from service tag <b>${req.serviceSource}</b> to <b>${req.serviceDestination}</b>`,
                description: 
                `Security rule [${failedRule.name}](https://ms.portal.azure.com/#@microsoft.onmicrosoft.com/resource${networkSecurityGroupResourceId}/overview) 
                is blocking access to **${req.serviceDestination}** on ${req.num > 1 ? "ports" : "port"} ${req.num}. 
                 Please modify the existing security rule or add a higher priority rule that allows 
                 ${Array.isArray(req.dir) ? "inbound and outbound" : req.dir == SecurityRuleDirection.INBOUND ? "inbound" : "outbound"} traffic 
                 from service tags **${req.serviceSource}** to **${req.serviceDestination}** on ports ${req.num}. 
                 For more information on port requirements, please visit the 
                 [VNet configuration reference](https://docs.microsoft.com/en-us/azure/api-management/virtual-network-reference?tabs=stv2).`
            });
        }
    });

    return failedChecks;
}

function generateStatusMarkdownTable(statuses: ConnectivityStatusContract[]) {
    let statusMarkdown = {
        0: `<i class="${StatusStyles.HealthyIcon}" style="width: 17px; height: 17px;"></i> Success`, // pass
        1: `<i class="${StatusStyles.WarningIcon}" style="width: 17px; height: 17px;"></i> Warning`, // warning
        2: `<i class="${StatusStyles.CriticalIcon}" style="width: 17px; height: 17px;"></i> Error`, // fail
    };
    const len = 30;
    return `
    | Status | Name | Resource Group |
    |--------|------|----------------|
    ` + statuses.map(status => 
    `|   ${statusMarkdown[rateConnectivityStatus(status)]} | ${status.name.length > len ? status.name.substring(0, len) + "..." : status.name} | ${status.resourceType} |`).join(`\n`);
}

function generateRequirementViolationTable(requirements: RequirementResult[]): string {
    let statusMarkdown = {
        0: `<i class="${StatusStyles.HealthyIcon}" style="width: 17px; height: 17px;"></i> Success`, // pass
        1: `<i class="${StatusStyles.WarningIcon}" style="width: 17px; height: 17px;"></i> Warning`, // warning
        2: `<i class="${StatusStyles.CriticalIcon}" style="width: 17px; height: 17px;"></i> Error`, // fail
    };

    console.log("requirements", requirements);
    
    return "| Status | Desription |\n" +
           "|--------|------------|\n" + 
           requirements.map((req: RequirementResult) => 
           `| ${statusMarkdown[req.status]} | ${req.description.replace(/(\r\n|\n|\r)/gm, "")} |`).join("\n");
}

async function getVnetInfoView(diagProvider: DiagProvider, 
    serviceResource: ApiManagementServiceResource, 
    networkType: VirtualNetworkType = VirtualNetworkType.EXTERNAL, 
    platformVersion: PlatformVersion = PlatformVersion.STV2) {

    const subnetResourceId = serviceResource.properties.virtualNetworkConfiguration.subnetResourceId;
    const subnetResponse = await diagProvider.getResource<Subnet>(subnetResourceId, NETWORK_API_VERSION);
    const subnet = subnetResponse.body;

    const networkSecurityGroupResourceId = subnet.properties.networkSecurityGroup.id;
    const networkSecurityGroupResponse = await diagProvider.getResource<NetworkSecurityGroup>(networkSecurityGroupResourceId, NETWORK_API_VERSION);
    const networkSecurityGroup = networkSecurityGroupResponse.body;

    const securityRules = [...networkSecurityGroup.properties.defaultSecurityRules, ...networkSecurityGroup.properties.securityRules];
    securityRules.sort((a, b) => a.properties.priority - b.properties.priority);

    let requirements = (platformVersion == PlatformVersion.STV1 ? stv1portRequirements : stv2portRequirements).filter(req => has(req.vnetType, networkType));
    let violatedRequirements = requirementCheck(requirements, securityRules, networkSecurityGroup.id);

    let view;
    if(violatedRequirements.length == 0) {
        view = new InfoStepView({
            id: "netsec-view",
            title: "VNET Status",
            infoType: InfoType.diagnostic,
            markdown: `No isues detected!`
        });
    
    } else {
        view = new CheckStepView({
            id: "netsec-view",
            title: "VNET Status",
            expandByDefault: true,
            level: getWorstStatus(violatedRequirements.map(req => req.status)),
            bodyMarkdown: generateRequirementViolationTable(violatedRequirements),
            // subChecks: violatedRequirements.map(req => {
            //     return {
            //         level: req.status,
            //         title: req.name,
            //         bodyMarkdown: req.description
            //     }
            // })
        });
    
    }

    return view;
}

async function getNoVnetView() {
    const view = new InfoStepView({
        title: "VNET Status",
        infoType: InfoType.recommendation,
        id: "secondStep",
        markdown: `
            ## No VNet Configuration detected
            No problems then!
        `,
    });

    return view;
}

export const DnsFlow: NetworkCheckFlow = {
    title: "Network Connectivity Check",
    id: "networkCheckFlow",

    func: async (siteInfo, diagProvider, flowMgr) => {
        const resourceId = siteInfo.resourceUri;
        flowMgr.addView(getNetworkStatusView(diagProvider, resourceId),  "Running network checks");

        const serviceResourceResponse = await diagProvider.getResource<ApiManagementServiceResource>(resourceId, APIM_API_VERSION);
        let serviceResource = serviceResourceResponse.body;


        let networkType = serviceResource.properties.virtualNetworkType;
        if (networkType != VirtualNetworkType.NONE) {
            flowMgr.addView(getVnetInfoView(diagProvider, serviceResource, networkType), "Gathering VNET Configuration");
        } else {
            flowMgr.addView(getNoVnetView(), "Gathering VNET Configuration");
        }

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