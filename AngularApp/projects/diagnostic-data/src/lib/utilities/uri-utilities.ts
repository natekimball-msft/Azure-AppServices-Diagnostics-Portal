import { ResourceDescriptor } from '../models/resource-descriptor';
import { StringUtilities } from './string-utilities';

export class UriUtilities {
    static BuildDetectorLink(resourceUri: string, detectorId: string): string {
        const path = UriUtilities.getPathByResourceType(resourceUri);
        return 'https://portal.azure.com' +
            `/?websitesextension_ext=asd.featurePath%3Ddetectors%2F${detectorId}#@microsoft.onmicrosoft.com` +
            `/resource/${StringUtilities.TrimBoth(resourceUri, '/')}/${path}`;
    }

    static buildSlotLink(resourceUri: string, isTargetingPreview: boolean): string {
        const path = UriUtilities.getPathByResourceType(resourceUri);
        return `https://portal.azure.com/?websitesextension_ext=asd.ispreview%3D${isTargetingPreview}#@microsoft.onmicrosoft.com/resource/${StringUtilities.TrimBoth(resourceUri, '/')}/${path}`;
    }

    private static getPathByResourceType(resourceUri: string): string {
        const resourceDescriptor = ResourceDescriptor.parseResourceUri(resourceUri);
        const type = `${resourceDescriptor.provider}/${resourceDescriptor.type}`.toLowerCase();

        switch (type) {
            case "microsoft.signalrservice/signalr":
                return "diagnostic";
            case "microsoft.logic/integrationserviceenvironments":
                return "troubleshoot";
            case "microsoft.containerservice/managedclusters":
                return "aksDiagnostics";
            case "microsoft.appplatform/spring":
                return "troubleshooting";
            default:
                return "troubleshoot";
        }

    }

    static serializeQueryParams(obj) {
      var str = [];
      for (var p in obj)
        if (obj.hasOwnProperty(p) && obj[p] !== undefined) {
          str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
        }
      return str.join("&");
    }
    
    
    static removeQueryParams(allQueryParams: { [key: string]: any }, removeQueryList: string[]) {
        const allQueryParamKeys = Object.keys(allQueryParams);
        const queryParams = {};
        for(const key of allQueryParamKeys){
            if(removeQueryList.findIndex(q => q.toLowerCase() === key.toLowerCase()) === -1){
                queryParams[key] = allQueryParams[key];
            }
        }
        return queryParams;
    }

    static removeChildDetectorStartAndEndTime(allQueryParams: { [key: string]: any }) {
        return UriUtilities.removeQueryParams(allQueryParams,["startTimeChildDetector","endTimeChildDetector", "branchInput"]);
    }


    // Adds the additional query params to the url 
    static addAdditionalQueryParams(additionalQueryParams: { [key: string]: any }, originalParams: string ) {
        for(let key of Object.keys(additionalQueryParams)) {
            if(originalParams.indexOf(key) === -1) {
                originalParams += `&${key}=${additionalQueryParams[key]}`;
            }
        }
        return originalParams;
    }

    static isNoResourceCall(resourceUri: string): boolean {
        // Temporary fix for DaaS, it genuinely passes in a resourceUri of "NoResource" in the format /subscriptions/{subscriptionId}/providers/Microsoft.Storage/storageaccounts and the call should be created appropriately.
        return `${resourceUri}`.toLowerCase().indexOf('/providers/microsoft.storage/storageaccounts') > -1 ? false : `${resourceUri}`.toLowerCase().indexOf('/resourcegroups/') < 0;
    }

    static isApolloApiCall(resourceUri: string): boolean {
        return `${resourceUri}`.toLowerCase().indexOf('/microsoft.diagnostics/apollo/') > -1;
    }
}
