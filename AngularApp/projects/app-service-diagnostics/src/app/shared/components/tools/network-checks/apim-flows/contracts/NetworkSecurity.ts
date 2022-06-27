
// https://docs.microsoft.com/en-us/rest/api/virtualnetwork/network-security-groups/get#networksecuritygroup
export interface NetworkSecurityGroup {
    etag: string;
    id: string;
    location: string;
    name: string;
    properties: {
        defaultSecurityRules: SecurityRule[];
        // flowLogs: FlowLog[];
        networkInterfaces: NetworkInterface[];
        provisioningState: ProvisioningState;
        resourceGuid: string;
        securityRules: SecurityRule[];
        subnets: Subnet[];
        type: string;
    }
}

// https://docs.microsoft.com/en-us/rest/api/virtualnetwork/network-security-groups/get#securityrule
export interface SecurityRule {
    etag: string;
    id: string;
    name: string;
    type: string;

    properties: {
        access: SecurityRuleAccess;
        description: string;
        destinationAddressPrefix: string;
        destinationAddressPrefixes: string[];
        destinationApplicationSecurityGroups: ApplicationSecurityGroup[];
        destinationPortRange: string;
        destinationPortRanges: string[];
        direction: SecurityRuleDirection;
        priority: number;
        protocol: SecurityRuleProtocol;
        provisioningState: ProvisioningState;
        sourceAddressPrefix: string;
        sourceAddressPrefixes: string[];
        // sourceApplicationSecurityGroups: 
        sourcePortRange: string;
        sourcePortRanges: string[];
    }
}

interface NetworkInterface {
    etag: string;

    id: string;
    location: string;
    name: string;



    enableAcceleratedNetworking: boolean;
    enableIPForwarding: boolean;
    hostedWorkloads: string[];

    macAddress: string[];

    networkSecurityGroup: NetworkSecurityGroup;

    primary: boolean;


    provisioningState: ProvisioningState;
    resourceGuid: string;


    vnetEncryptionSupported: boolean;
    workloadType: string;
    // tags
    type: string;
}

export interface Subnet {
    etag: string;
    id: string;
    name: string;
    properties: {
        addressPrefix: string;
        addressPrefixes: string[];
        networkSecurityGroup: {
            id: string;
        }
        purpose: string;
    }
    type: string;
}

// https://docs.microsoft.com/en-us/rest/api/virtualnetwork/network-security-groups/get#securityruleaccess
export enum SecurityRuleAccess {
    ALLOW = "Allow",
    DENY = "Deny"
}

// https://docs.microsoft.com/en-us/rest/api/virtualnetwork/network-security-groups/get#applicationsecuritygroup
interface ApplicationSecurityGroup {
    etag: string;
    id: string;
    location: string;
    name: string;
    provisioningState: ProvisioningState;
    resourceGuid: string;
    // tags:
    type: string;
}

// https://docs.microsoft.com/en-us/rest/api/virtualnetwork/network-security-groups/get#provisioningstate
export enum ProvisioningState {
    DELETING = "Deleting",
    FAILED = "Failed",
    SUCCEEDED = "Succeeded",
    UPDATING = "Updating"
}

// https://docs.microsoft.com/en-us/rest/api/virtualnetwork/network-security-groups/get#securityruledirection
export enum SecurityRuleDirection {
    INBOUND = "Inbound",
    OUTBOUND = "Outbound"
}

// https://docs.microsoft.com/en-us/rest/api/virtualnetwork/network-security-groups/get#securityruleprotocol
export enum SecurityRuleProtocol {
    AST = "*",
    AH = "Ah",
    ESP = "Esp",
    ICMP = "Icmp",
    TCP = "Tcp",
    UDP = "Udp"
}

