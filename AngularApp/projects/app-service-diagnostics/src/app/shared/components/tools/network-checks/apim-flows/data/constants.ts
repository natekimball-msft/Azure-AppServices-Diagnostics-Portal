import { ResourceDescriptor, StatusStyles } from 'diagnostic-data';


export const APIM_API_VERSION = "2021-12-01-preview";
export const NETWORK_API_VERSION = "2021-08-01";

export let statusIconMarkdown = {
    0: `<i class="${StatusStyles.HealthyIcon}" style="width: 17px; height: 17px;"></i> Success`,
    1: `<i class="${StatusStyles.WarningIcon}" style="width: 17px; height: 17px;"></i> Warning`,
    2: `<i class="${StatusStyles.CriticalIcon}" style="width: 17px; height: 17px;"></i> Error`, // fail
};