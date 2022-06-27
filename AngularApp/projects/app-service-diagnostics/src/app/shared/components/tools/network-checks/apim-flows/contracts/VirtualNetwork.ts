import { Subnet } from "./NetworkSecurity";

export interface VirtualNetwork {
    etag: string;
    extendedLocation: ExtendedLocation;
    id: string;
    location: string;
    name: string;
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
    type: string;
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
    // eforcement
}