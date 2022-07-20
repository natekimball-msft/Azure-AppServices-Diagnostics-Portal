import { DnsFlow } from "./apim-flows/DnsFlow";
import { NetworkCheckFlow } from "./network-check-flow";
import { NetworkCheckFlowSet } from "./network-check-flow-set";
import { learnMoreFlow } from './network-check-flows/learnMoreFlow.js';

export class ApimFlowSet implements NetworkCheckFlowSet{
    name: "APIM";
    flows: NetworkCheckFlow[] = [
        DnsFlow
    ];
}