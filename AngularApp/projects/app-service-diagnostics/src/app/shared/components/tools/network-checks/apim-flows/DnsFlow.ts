import { DropdownStepView, InfoStepView, StepFlow, StepFlowManager, CheckStepView, StepViewContainer, InputStepView, ButtonStepView, PromiseCompletionSource, TelemetryService } from 'diagnostic-data';
import { NetworkCheckFlow } from "../network-check-flow"
import { NetworkStatusContact } from './Contact/NetworkStatus';

export const DnsFlow: NetworkCheckFlow = {
    title: "DNS flow",
    id: "dnsFlow",
    func: async (siteInfo, diagProvider, flowMgr) => {
        const resoureceId = siteInfo.resourceUri;
        const networkStatusResponse = await diagProvider.getResource<NetworkStatusContact[]>(resoureceId + "/networkstatus", "2021-01-01-preview");
        const networkStatuses = networkStatusResponse.body;
        console.log(networkStatuses);
        flowMgr.addView(new CheckStepView({
            title: "Check DNS",
            level: 0,
            id: "firstStep"
        }))
    }
};