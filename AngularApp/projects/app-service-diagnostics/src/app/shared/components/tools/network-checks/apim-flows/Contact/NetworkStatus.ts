export interface NetworkStatusContact {
    location: string;
    networkStatus: {
        dnsServers: string[],
        connectivityStatus: ConnectivityStatusContract[],
    }
}

export interface ConnectivityStatusContract {
    error?: string,
    isOptional?: boolean,
    lastStatusChange: string,
    lastUpdated: string,
    name: string,
    resourceType: string,
    status: ConnectivityStatusType
}

export enum ConnectivityStatusType {
    Fail = "failure",
    Init = "initializing",
    Success = "success"
}