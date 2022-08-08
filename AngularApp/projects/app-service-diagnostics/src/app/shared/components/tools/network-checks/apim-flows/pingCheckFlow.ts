import { FormStepView, InfoStepView, InfoType, StepView } from 'diagnostic-data';
import { InputType } from 'projects/diagnostic-data/src/lib/models/form';
import { DiagProvider } from '../diag-provider';
import { NetworkCheckFlow } from "../network-check-flow";
import { ApiManagementServiceResourceContract } from './contracts/APIMService';
import { ConnectivityCheckPayloadContract, ConnectivityCheckProtocol, ConnectivityCheckResponse, ErrorResponseContract, Method, PreferredIPVersion } from './contracts/ConnectivityCheck';
import { APIM_API_VERSION } from './data/constants';


function generatePayload(inputs: {[key: string]: string}, authorization: string): ConnectivityCheckPayloadContract {    
    return {
        "source": {
            "region": inputs["region"]
        },
        "destination": {
            "address": inputs["ipaddr"],
            "port": parseInt(inputs["destport"]),
        },
        protocol: (inputs["protocol"] as ConnectivityCheckProtocol),
        protocolConfiguration: { // only needed for protocol http or https
            HTTPConfiguration: {
                headers: [
                    {
                        name: "Authorization",
                        value: authorization
                    }
                ],
                method: Method.GET,
                "validStatusCodes": [
                    200,
                    204
                ],
            }
        },
        "preferredIPVersion": PreferredIPVersion.IPv4
    }
}

async function queryPingData(diagProvider: DiagProvider, resourceId: string, authorization: string, inputs: {[key: string]: string}): Promise<ConnectivityCheckResponse | ErrorResponseContract> {    
    return diagProvider
        .extendedPostResourceAsync<ConnectivityCheckResponse | ErrorResponseContract, ConnectivityCheckPayloadContract>
            (resourceId + "/connectivityCheck", generatePayload(inputs, authorization), APIM_API_VERSION)
        .catch(error => error);
}

async function displayPingData(diagProvider: DiagProvider, resId: string, authorization: string, inputs: {[key: string]: string}): Promise<StepView> {

    let res = await queryPingData(diagProvider, resId, authorization, inputs);

    let errRes = res as ErrorResponseContract;
    if (errRes && errRes.error) {
        return new InfoStepView({
            title: errRes.error.code,
            infoType: InfoType.diagnostic,
            id: "secondStep",
            markdown: `${errRes.error.message}`,
        });
    } else {

    }

    return new InfoStepView({
        title: "VNET Status",
        infoType: InfoType.recommendation,
        id: "secondStep",
        markdown: `
            ## No VNet Configuration detected
        `,
    });
}

export const pingCheckFlow: NetworkCheckFlow = {
    title: "Dependency Access Issues",
    id: "pingCheckFlow",

    func: async (siteInfo, diagProvider, flowMgr) => {
        
        const resourceId = siteInfo.resourceUri;
        const serviceResourceResponse = await diagProvider.getResource<ApiManagementServiceResourceContract>(resourceId, APIM_API_VERSION);
        
        let serviceResource = serviceResourceResponse.body;

        let locations = [serviceResource.location, ...(serviceResource.properties.additionalLocations || []).map(loc => loc.location)];

        let authorizationToken = diagProvider.getAuthorizationToken();

        let fqdn = "(?=^.{4,253}$)(^((?!-)[a-zA-Z0-9-]{1,63}(?<!-)\.)+[a-zA-Z]{2,63}$)";
        let ipaddr = "(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)";
        let url = "([A-Za-z]+:\/\/[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_:%&;\?\#\/.=]+)";
        flowMgr.addView(new FormStepView({
            id: "form1",
            description: "form 2",
            inputs: [
                {
                    itype: InputType.TextBox,
                    id: "ipaddr",
                    description: "URL or IP address",
                    placeholder: "0.0.0.0 or url",
                    pattern: `${url}|${ipaddr}`
                },
                {
                    itype: InputType.TextBox,
                    id: "destport",
                    description: "Destination port",
                    // placeholder: "",
                    // tooltip: "extra info",
                    value: "80"
                },
                {
                    itype: InputType.DropDown,
                    id: "protocol",
                    description: "Protocol",
                    // tooltip: "extra info",
                    value: 0,
                    options: ["HTTPS", "HTTP", "TCP"],
                },
                {
                    itype: InputType.DropDown,
                    id: "region",
                    description: "Location",
                    value: 0,
                    options: locations
                }
            ],
            expandByDefault: false,
            buttonText: "send data",
            callback: (inputs) => {
                flowMgr.addView(displayPingData(diagProvider, resourceId, authorizationToken, inputs), "Querying the network");
                return Promise.resolve();
            },
        }));
    }
};