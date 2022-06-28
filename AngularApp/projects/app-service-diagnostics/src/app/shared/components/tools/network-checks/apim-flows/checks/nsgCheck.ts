import { checkResultLevel, CheckStepView, InfoStepView, InfoType, StepFlowManager } from 'diagnostic-data';
import { DiagProvider } from '../../diag-provider';
import { ApiManagementServiceResourceContract, PlatformVersion, VirtualNetworkType } from '../contracts/APIMService';
import { NetworkSecurityGroupContract, ProvisioningState, SecurityRuleAccess, SecurityRuleContract, SecurityRuleProtocol, SubnetContract } from '../contracts/NetworkSecurity';
import { PortRequirements, stv1portRequirements, stv2portRequirements } from '../data/portRequirements';
import { NETWORK_API_VERSION, statusIconMarkdown } from '../dnsFlow';
import { getWorstStatus } from "./networkStatusCheck";

class PortRange {
    portLowerBound?: number;
    portUpperBound?: number;
    ports?: number[];

    constructor(ports: string) {
        this.ports = null;
        
        if (ports == "*") {
            this.portLowerBound = 0;
            this.portUpperBound = 65536;
        } else if (ports.includes("-")) {
            let [p1, p2] = ports.split("-");
            this.portLowerBound = parseInt(p1);
            this.portUpperBound = parseInt(p2);
        } else if (ports.includes(",")) {
            this.portLowerBound = null;
            this.portUpperBound = null;
            this.ports = ports.split(",").map(p => parseInt(p));
        } else {
            let port = parseInt(ports);
            this.portLowerBound = port;
            this.portUpperBound = port;
        }
    }

    has(port: number) {
        if (this.portLowerBound && this.portUpperBound) {
            return this.portLowerBound <= port && port <= this.portUpperBound;
        } else if (this.portUpperBound) {
            throw Error(`invalid state for PortRange obj: ${this.portLowerBound}, ${this.portUpperBound}, ${this.ports}`);
        } else if (this.portLowerBound) {
            throw Error(`invalid state for PortRange obj: ${this.portLowerBound}, ${this.portUpperBound}, ${this.ports}`);
        } else if (this.ports) {
            return this.ports.includes(port);
        } else {
            throw Error(`invalid state for PortRange obj: ${this.portLowerBound}, ${this.portUpperBound}, ${this.ports}`);
        }
    }
}

function sameProtocol(protocol1: SecurityRuleProtocol, protocol2: SecurityRuleProtocol) {
    return protocol1 == SecurityRuleProtocol.AST || protocol2 == SecurityRuleProtocol.AST || protocol1 == protocol2;
}

function samePorts(ports: number[], pRange: string) {
    let destinationPortRange = new PortRange(pRange);
    // -1 means all ports
    return ports.includes(-1) || !ports.some((n) => destinationPortRange.has(n));
}

function sameIP(ip1: string, ip2: string) {
    return ip1 == "*" || ip2 == "*" || ip1 == "Any" || ip2 == "Any" || ip1 == ip2 ||
        (ip1 == "Internet" && ip2 != "VirtualNetwork") || (ip1 != "VirtualNetwork" && ip2 == "Internet");
}

function rulePassed(requirement: PortRequirements, rule: SecurityRuleContract) {
    if (rule.properties.access == SecurityRuleAccess.ALLOW)
        return true;
    if (rule.properties.provisioningState != ProvisioningState.SUCCEEDED)
        return true;

    // do vnet type check outside here!
    if (!requirement.dir.includes(rule.properties.direction))
        return false;
    if (!sameProtocol(requirement.protocol, rule.properties.protocol))
        return false;

    if (!samePorts(requirement.num, rule.properties.destinationPortRange))
        return true;
    return sameIP(requirement.serviceSource, rule.properties.sourceAddressPrefix)
        && sameIP(requirement.serviceDestination, rule.properties.destinationAddressPrefix);
}
interface RequirementResult {
    status: checkResultLevel;
    name: string;
    description: string;
}

function requirementCheck(requirements: PortRequirements[], rules: SecurityRuleContract[]): RequirementResult[] {
    let failedChecks: RequirementResult[] = [];

    requirements.forEach(req => {
        let failedRule = rules.find(r => !rulePassed(req, r));

        if (failedRule != undefined) {
            failedChecks.push({
                status: req.required ? checkResultLevel.fail : checkResultLevel.warning,
                name: failedRule.name,
                description: req.purpose
            });
        }
    });

    return failedChecks;
}
function generateRequirementViolationTable(requirements: RequirementResult[], nsgResId: string): string {
    return `
        | Status | Rule Name | Desription |\n
        |--------|-----------|------------|\n` + 
        requirements.map((req: RequirementResult) => 
        `| ${statusIconMarkdown[req.status]} | [${req.name}](https://ms.portal.azure.com/#@microsoft.onmicrosoft.com/resource${nsgResId}/overview) | ${req.description.replace(/(\r\n|\n|\r)/gm, "")} |`).join("\n");
}


async function getVnetInfoView(diagProvider: DiagProvider,
    serviceResource: ApiManagementServiceResourceContract,
    networkType: VirtualNetworkType = VirtualNetworkType.EXTERNAL,
    platformVersion: PlatformVersion = PlatformVersion.STV2) {

    const subnetResourceId = serviceResource.properties.virtualNetworkConfiguration.subnetResourceId;
    const subnetResponse = await diagProvider.getResource<SubnetContract>(subnetResourceId, NETWORK_API_VERSION);
    const subnet = subnetResponse.body;

    const networkSecurityGroupResourceId = subnet.properties.networkSecurityGroup.id;
    const networkSecurityGroupResponse = await diagProvider.getResource<NetworkSecurityGroupContract>(networkSecurityGroupResourceId, NETWORK_API_VERSION);
    const networkSecurityGroup = networkSecurityGroupResponse.body;

    const securityRules = [...networkSecurityGroup.properties.defaultSecurityRules, ...networkSecurityGroup.properties.securityRules];
    securityRules.sort();

    let portRequirements = (platformVersion == PlatformVersion.STV1 ? stv1portRequirements : stv2portRequirements);
    portRequirements = portRequirements.filter(req => req.vnetType.includes(networkType));
    let violatedRequirements = requirementCheck(portRequirements, securityRules);

    let view;
    if (violatedRequirements.length == 0) {
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
            bodyMarkdown: generateRequirementViolationTable(violatedRequirements, networkSecurityGroupResourceId),
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
export interface Body {
    location?: string;
}
export function nsgRuleCheck(networkType: VirtualNetworkType, flowMgr: StepFlowManager, diagProvider: DiagProvider, serviceResource: ApiManagementServiceResourceContract) {
    if (networkType != VirtualNetworkType.NONE) {
        flowMgr.addView(getVnetInfoView(diagProvider, serviceResource, networkType), "Gathering VNET Configuration");
    } else {
        flowMgr.addView(getNoVnetView(), "Gathering VNET Configuration");
    }
}
