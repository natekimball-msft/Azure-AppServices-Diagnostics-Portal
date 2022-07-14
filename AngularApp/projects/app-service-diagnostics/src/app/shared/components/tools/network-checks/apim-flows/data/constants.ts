import { ResourceDescriptor, StatusStyles } from 'diagnostic-data';


export const APIM_API_VERSION = "2021-12-01-preview";
export const NETWORK_API_VERSION = "2021-08-01";

let iconContainerStyles = "display: flex; align-items: center; padding-left: 1px; padding-bottom: 1px;";
let iconStyles = "width: 17px; height: 17px; margin-right: 5px;";
export let statusIconMarkdown = {
    0: `<div style="${iconContainerStyles}"><i class="${StatusStyles.HealthyIcon}" style="${iconStyles}"></i> Success</div>`,
    1: `<div style="${iconContainerStyles}"><i class="${StatusStyles.WarningIcon}" style="${iconStyles}"></i> Warning</div>`,
    2: `<div style="${iconContainerStyles}"><i class="${StatusStyles.CriticalIcon}" style="${iconStyles}"></i> Error</div>`, // fail
};