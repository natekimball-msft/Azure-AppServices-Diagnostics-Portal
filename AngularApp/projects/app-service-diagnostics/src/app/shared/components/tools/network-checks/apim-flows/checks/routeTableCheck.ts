import { Check, checkResultLevel, CheckStepView, StepFlowManager, StepView } from 'diagnostic-data';
import { DiagProvider } from '../../diag-provider';
import { ApiManagementServiceResourceContract, VirtualNetworkConfigurationContract, VirtualNetworkType } from '../contracts/APIMService';
import { RouteTableContract, SubnetContract } from '../contracts/NetworkSecurity';
import { NETWORK_API_VERSION } from '../data/constants';


interface RouteTableContractWithResId extends RouteTableContract {
    resourceId: string;
}

function getVNetConfigsByLocation(serviceResource: ApiManagementServiceResourceContract): {[key: string]: VirtualNetworkConfigurationContract} {
    let vnetConfigsByLocation = {};
    
    if (serviceResource.location) {
        vnetConfigsByLocation[serviceResource.location] = serviceResource.properties.virtualNetworkConfiguration;
    }

    if (serviceResource.properties.additionalLocations) {
        for (let loc of serviceResource.properties.additionalLocations) {
            vnetConfigsByLocation[loc.location] = loc.virtualNetworkConfiguration;
        }    
    }
    
    return vnetConfigsByLocation;
}

function getRouteTableByLocation(
    diagProvider: DiagProvider, 
    serviceResource: ApiManagementServiceResourceContract, 
    vnetConfigsByLocation: {[key: string]: VirtualNetworkConfigurationContract}): {[key: string]: Promise<RouteTableContractWithResId> | RouteTableContractWithResId} {
    let routeTableByLocation = {};

    for (let loc of Object.keys(vnetConfigsByLocation)) {
        const subnetResourceId = serviceResource.properties.virtualNetworkConfiguration.subnetResourceId;
        const resourceIdPrefix = subnetResourceId.split("virtualNetworks")[0];
        routeTableByLocation[loc] = diagProvider.getResource<SubnetContract>(subnetResourceId, NETWORK_API_VERSION)
            .then(res => res.body)
            .then(subnet => subnet.properties.routeTable)
            .then(table => {
                return {
                ...table, 
                resourceId: `${resourceIdPrefix}/routeTables/${table.name}/overview`}});
    }

    return routeTableByLocation;
}

function performRouteTableCheck(location: string, table: RouteTableContractWithResId): Check {

    let hasRouteTable = !!(table.properties);
    let hasOmniQualifier = hasRouteTable && table.properties.routes.some(route => route.properties.addressPrefix.includes("/0")); // match 0 bits

    return {
        title: location,
        level: hasOmniQualifier ? checkResultLevel.warning : checkResultLevel.pass,
        bodyMarkdown: hasRouteTable ? hasOmniQualifier ? 
                                `Resource has a route that qualifies for everything. If you would like to change it, please change the route table settings [here](${table.resourceId})` : 
                                "No issues detected in this resource" :
                                "No issues detected in this resource"
    }
}

async function routeTableView(
    diagProvider: DiagProvider, 
    serviceResource: ApiManagementServiceResourceContract): Promise<StepView> {

    let vnetConfigsByLocation = getVNetConfigsByLocation(serviceResource);
    let routeTableByLocation = getRouteTableByLocation(diagProvider, serviceResource, vnetConfigsByLocation);

    await Promise.all(Object.values(routeTableByLocation));

    // console.log("route tables", routeTableByLocation);
    return new CheckStepView({
        title: "Route Table Status",
        level: checkResultLevel.pass,
        id: "thirdStep",
        subChecks: Object.entries(routeTableByLocation).map(([loc, table]) => performRouteTableCheck(loc, (table as RouteTableContractWithResId)))
    });
}

export function routeTableCheck(
    networkType: VirtualNetworkType,
    flowMgr: StepFlowManager, 
    diagProvider: DiagProvider, 
    serviceResource: ApiManagementServiceResourceContract) {

    if (networkType != VirtualNetworkType.NONE) {
        flowMgr.addView(routeTableView(diagProvider, serviceResource), "Performing Route Table checks");
    } else {
    }
}
