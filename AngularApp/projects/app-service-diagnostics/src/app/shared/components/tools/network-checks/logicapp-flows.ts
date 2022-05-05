import { NetworkCheckFlow } from "./network-check-flow";
import { NetworkCheckFlowSet } from "./network-check-flow-set";
import { configFailureFlow } from './network-check-flows/configFailureFlow.js';
import { connectionFailureFlow } from './network-check-flows/connectionFailureFlow.js';
import { subnetDeletionFlow } from './network-check-flows/subnetDeletionFlow.js'

export class LogicAppFlowSet implements NetworkCheckFlowSet{
    name: "logicapp(standard)";
    flows: NetworkCheckFlow[] = [
        connectionFailureFlow,
        configFailureFlow,
        subnetDeletionFlow
    ];
}