export interface NetworkStatusContact {
    location: string;
    networkStatus: {
        dnsServers: string[],
        connectivityStatus: {
            error?: string,
            isOptional?: boolean,
            lastStatusChange: string,
            lastUpdated: string,
            name: string,
            resourceType: string,
            status: ConnectivityStatusContract
        }
    }
}

export enum ConnectivityStatusContract {
    Fail = "failure",
    Init = "initializing",
    Success = "success"
}