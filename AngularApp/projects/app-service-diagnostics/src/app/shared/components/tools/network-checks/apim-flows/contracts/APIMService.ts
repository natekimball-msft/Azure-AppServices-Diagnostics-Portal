import { ArmObj } from "projects/app-service-diagnostics/src/app/shared/models/armObj";

// https://docs.microsoft.com/en-us/rest/api/apimanagement/previous-ga/api-management-service/get#apimanagementserviceresource
export interface ApiManagementServiceResourceContract extends ArmObj {
    etag: string;
    zones: string[];
    properties: {
        additionalLocations: AdditionalLocationContract[];
        developerPortalUrl: string;
        disableGateway: boolean;
        gatewayUrl: string;
        // hostnamesCOnfigurations: 
        managementApiUrl: string;


        portalUrl: string;
        privateIPAddresses?: string[];
        platformVersion: PlatformVersion;

        publicIPAddresses?: string[];
        publicIPAddressId?: string;

        virtualNetworkConfiguration?: VirtualNetworkConfigurationContract;
        virtualNetworkType: VirtualNetworkType;
    }
}

export interface VirtualNetworkConfigurationContract {
    subnetResourceId: string;
    subnetname: string;
    vnetid: string;
}

export enum VirtualNetworkType {
    EXTERNAL = "External",
    INTERNAL = "Internal",
    NONE = "None"
}

export enum PlatformVersion {
    STV1 = "stv1",
    STV2 = "stv2"
}

// https://docs.microsoft.com/en-us/rest/api/apimanagement/previous-ga/api-management-service/get#additionallocation
interface AdditionalLocationContract {
    disableGateway: boolean;
    gatewayRegionalUrl: string;
    location: string;
    // platformVersion: 
    privateIPAddresses: string[];
    publicIPAddresses: string[];
    publicIpAddressId: string;
    virtualNetworkConfiguration: VirtualNetworkConfigurationContract;
    zones: string[];
}