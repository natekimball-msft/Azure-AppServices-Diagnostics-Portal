import { FormStepView, InfoStepView, InfoType, InputStepView } from 'diagnostic-data';
import { NetworkCheckFlow } from "../network-check-flow";
import { APIM_API_VERSION } from './data/constants';
import { ApiManagementServiceResourceContract } from './contracts/APIMService';
import { InputType } from 'projects/diagnostic-data/src/lib/models/form';

export const pingCheckFlow: NetworkCheckFlow = {
    title: "Dependency Access Issues",
    id: "pingCheckFlow",

    func: async (siteInfo, diagProvider, flowMgr) => {
        

        flowMgr.addView(new FormStepView({
            id: "form1",
            description: "form 2",
            inputs: [
                {
                    itype: InputType.TextBox,
                    id: "ipaddr",
                    description: "URL or IP address",
                    placeholder: "0.0.0.0",
                    // tooltip: "extra info",
                    // value: "text box initial text"
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
                    options: ["HTTPS", "TCP", "UDP"],
                },
                // {
                //     itype: InputType.TextBox,
                //     id: "id2",
                //     description: "text label",
                //     placeholder: "placeholder",
                //     tooltip: "extra info",
                //     value: "text box initial text"
                // }
            ],
            expandByDefault: false,
            buttonText: "send data",
            callback: (input) => {alert("hello!"); return Promise.resolve();},
        }));
    }
};