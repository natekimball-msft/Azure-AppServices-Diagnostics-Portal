import { VirtualNetworkType } from '../Contract/APIMService';
import { SecurityRuleDirection, SecurityRuleProtocol } from '../Contract/NetworkSecurity';

export interface PortRequirements {
    num: number | number[];
    dir: SecurityRuleDirection | SecurityRuleDirection[];
    protocol: SecurityRuleProtocol;
    vnetType: VirtualNetworkType | VirtualNetworkType[];
    serviceSource: string;
    serviceDestination: string;
    required: boolean;
    purpose?: string;
}

// Internet = all service tags - VirtualNetwork
// TODO add optional field
let stv2portRequirements: PortRequirements[] = [
    {
        num: [80, 443],
        dir: SecurityRuleDirection.INBOUND,
        protocol: SecurityRuleProtocol.TCP,
        vnetType: VirtualNetworkType.EXTERNAL,
        serviceSource: "Internet",
        serviceDestination: "VirtualNetwork",
        required: true,
        purpose: "Client communication to API Management"
    },
    {
        num: 3443,
        dir: SecurityRuleDirection.INBOUND,
        protocol: SecurityRuleProtocol.TCP,
        vnetType: [VirtualNetworkType.INTERNAL, VirtualNetworkType.EXTERNAL],
        serviceSource: "ApiManagement",
        serviceDestination: "VirtualNetwork",
        required: true,
        purpose: "Management endpoint for Azure portal and PowerShell"
    },
    {
        num: 443,
        dir: SecurityRuleDirection.OUTBOUND,
        protocol: SecurityRuleProtocol.TCP,
        vnetType: [VirtualNetworkType.INTERNAL, VirtualNetworkType.EXTERNAL],
        serviceSource: "VirtualNetwork",
        serviceDestination: "Storage",
        required: true,
        purpose: "Dependency on Azure Storage"
    },
    {
        num: 443,
        dir: SecurityRuleDirection.OUTBOUND,
        protocol: SecurityRuleProtocol.TCP,
        vnetType: [VirtualNetworkType.INTERNAL, VirtualNetworkType.EXTERNAL],
        serviceSource: "VirtualNetwork",
        serviceDestination: "AzureActiveDirectory",
        required: false,
        purpose: "Azure Active Directory and Azure Key Vault dependency"
    },
    {
        num: 1443,
        dir: SecurityRuleDirection.OUTBOUND,
        protocol: SecurityRuleProtocol.TCP,
        vnetType: [VirtualNetworkType.INTERNAL, VirtualNetworkType.EXTERNAL],
        serviceSource: "VirtualNetwork",
        serviceDestination: "SQL",
        required: true,
        purpose: "Access to Azure SQL endpoints"
    },
    {
        num: 443,
        dir: SecurityRuleDirection.OUTBOUND,
        protocol: SecurityRuleProtocol.TCP,
        vnetType: [VirtualNetworkType.INTERNAL, VirtualNetworkType.EXTERNAL],
        serviceSource: "VirtualNetwork",
        serviceDestination: "AzureKeyVault",
        required: true,
        purpose: "Access to Azure Key Vault"
    },
    {
        num: [5671, 5672, 443],
        dir: SecurityRuleDirection.OUTBOUND,
        protocol: SecurityRuleProtocol.TCP,
        vnetType: [VirtualNetworkType.INTERNAL, VirtualNetworkType.EXTERNAL],
        serviceSource: "VirtualNetwork",
        serviceDestination: "EventHub",
        required: false,
        purpose: "Dependency for Log to Azure Event Hubs policy and monitoring agent"
    },
    {
        num: 445,
        dir: SecurityRuleDirection.OUTBOUND,
        protocol: SecurityRuleProtocol.TCP,
        vnetType: [VirtualNetworkType.INTERNAL, VirtualNetworkType.EXTERNAL],
        serviceSource: "VirtualNetwork",
        serviceDestination: "Storage",
        required: false,
        purpose: "Dependency on Azure File Share for GIT"
    },
    {
        num: [443, 12000],
        dir: SecurityRuleDirection.OUTBOUND,
        protocol: SecurityRuleProtocol.TCP,
        vnetType: [VirtualNetworkType.INTERNAL, VirtualNetworkType.EXTERNAL],
        serviceSource: "VirtualNetwork",
        serviceDestination: "AzureCloud",
        required: false,
        purpose: "Health and Monitoring Extension"
    },
    {
        num: [1886, 443],
        dir: SecurityRuleDirection.OUTBOUND,
        protocol: SecurityRuleProtocol.TCP,
        vnetType: [VirtualNetworkType.INTERNAL, VirtualNetworkType.EXTERNAL],
        serviceSource: "VirtualNetwork",
        serviceDestination: "AzureMonitor",
        required: false,
        purpose: "Publish Diagnostics Logs and Metrics, Resource Health, and Application Insights"
    },
    {
        num: [25, 587, 25028],
        dir: [SecurityRuleDirection.INBOUND, SecurityRuleDirection.OUTBOUND],
        protocol: SecurityRuleProtocol.TCP,
        vnetType: [VirtualNetworkType.INTERNAL, VirtualNetworkType.EXTERNAL],
        serviceSource: "VirtualNetwork",
        serviceDestination: "Internet",
        required: false,
        purpose: "Connect to SMTP Relay for sending e-mail"
    },
    {
        num: [6381, 6382, 6383],
        dir: [SecurityRuleDirection.INBOUND, SecurityRuleDirection.OUTBOUND],
        protocol: SecurityRuleProtocol.TCP,
        vnetType: [VirtualNetworkType.INTERNAL, VirtualNetworkType.EXTERNAL],
        serviceSource: "VirtualNetwork",
        serviceDestination: "VirtualNetwork",
        required: false,
        purpose: "Access Redis Service for Cache policies between machines"
    },
    {
        num: 4290,
        dir: [SecurityRuleDirection.INBOUND, SecurityRuleDirection.OUTBOUND],
        protocol: SecurityRuleProtocol.UDP,
        vnetType: [VirtualNetworkType.INTERNAL, VirtualNetworkType.EXTERNAL],
        serviceSource: "AzureLoadBalancer",
        serviceDestination: "VirtualNetwork",
        required: false,
        purpose: "Sync Counters for Rate Limit policies between machines"
    },
    {
        num: 6390,
        dir: SecurityRuleDirection.INBOUND,
        protocol: SecurityRuleProtocol.TCP,
        vnetType: [VirtualNetworkType.INTERNAL, VirtualNetworkType.EXTERNAL],
        serviceSource: "AzureLoadBalancer",
        serviceDestination: "VirtualNetwork",
        required: false,
        purpose: "Sync Counters for Rate Limit policies between machines"
    },
];

export default stv2portRequirements;
