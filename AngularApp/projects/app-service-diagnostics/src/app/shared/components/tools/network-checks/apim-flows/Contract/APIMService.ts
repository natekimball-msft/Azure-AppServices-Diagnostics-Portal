export interface ApiManagementServiceResource {
    etag: string;
    id: string;
    // identity
    location: string;
    name: string;
    properties: {
        additionalLocations: AdditionalLocation[];
        developerPortalUrl: string;
        disableGateway: boolean;
        gatewayUrl: string;
        // hostnamesCOnfigurations: 
        managementApiUrl: string;


        portalUrl: string;
        privateIPAddresses?: string[];

        publicIPAddresses?: string[];
        publicIPAddressId?: string;

        virtualNetworkConfiguration?: VirtualNetworkConfiguration;
        virtualNetworkType: VirtualNetworkType;
    }
    type: string;
    zones: string[];
}

interface VirtualNetworkConfiguration {
    subnetResourceId: string;
    subnetname: string;
    vnetid: string;
}

export enum VirtualNetworkType {
    EXTERNAL = "External",
    INTERNAL = "Internal",
    NONE = "None"
}

interface AdditionalLocation {
    disableGateway: boolean;
    gatewayRegionalUrl: string;
    location: string;
    // platformVersion: 
    privateIPAddresses: string[];
    publicIPAddresses: string[];
    publicIpAddressId: string;
    zones: string[];
}