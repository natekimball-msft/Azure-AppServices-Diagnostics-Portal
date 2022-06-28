import { ArmObj } from "projects/app-service-diagnostics/src/app/shared/models/armObj";
import { Subnet } from "./NetworkSecurity";

// https://docs.microsoft.com/en-us/rest/api/virtualnetwork/virtual-networks/get#virtualnetwork
export interface VirtualNetwork extends ArmObj {
    etag: string;
    extendedLocation: ExtendedLocation;
    
    properties: {
        addressSpace: AddressSpace;
        dhcpOptions: DhcpOptions;
        enableDdosProtection: boolean;
        enableVmProtection: boolean;
        encryption: VirtualNetworkEncryption;
        flowTimeoutInMinutes: number;
        resourceGuid: string;
        subnets: Subnet[];
    }

    tags: Object;
}

interface ExtendedLocation {
    name: string;
    type: ExtendedLocationTypes;
}

interface ExtendedLocationTypes {
    EdgeZone: string;
}

interface AddressSpace {
    addressPrefixes: string[];
}

interface DhcpOptions {
    dnsServers: string[];
}

interface VirtualNetworkEncryption {
    enabled: boolean;
}