import { ArmObj } from "projects/app-service-diagnostics/src/app/shared/models/armObj";

// https://docs.microsoft.com/en-us/rest/api/virtualnetwork/network-security-groups/get#networksecuritygroup
export interface NetworkSecurityGroup extends ArmObj {
    etag: string;
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

interface NetworkInterface extends ArmObj {
    etag: string;
    properties: {
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
    }
}

export interface Subnet extends ArmObj {
    etag: string;
    properties: {
        addressPrefix: string;
        addressPrefixes: string[];
        networkSecurityGroup: {
            id: string;
        }
        purpose: string;
    }
}

// https://docs.microsoft.com/en-us/rest/api/virtualnetwork/network-security-groups/get#securityruleaccess
export enum SecurityRuleAccess {
    ALLOW = "Allow",
    DENY = "Deny"
}

// https://docs.microsoft.com/en-us/rest/api/virtualnetwork/network-security-groups/get#applicationsecuritygroup
interface ApplicationSecurityGroup extends ArmObj {
    etag: string;
    properties: {
        provisioningState: ProvisioningState;
        resourceGuid: string;
    }
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

