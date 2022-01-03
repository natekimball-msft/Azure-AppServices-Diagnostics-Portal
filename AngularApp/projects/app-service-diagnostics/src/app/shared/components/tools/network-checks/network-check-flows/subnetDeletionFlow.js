import { DropdownStepView, InfoStepView, StepFlow, StepFlowManager, CheckStepView, StepViewContainer, InputStepView, ButtonStepView, PromiseCompletionSource, TelemetryService } from 'diagnostic-data';
import { SubnetDeletionWordings } from './subnetDeletionWordings.js';
import { addSubnetSelectionDropDownView, getWebAppVnetInfo } from './flowMisc.js';

export var subnetDeletionFlow = {
    title: "Subnet/VNet deletion issue",
    async func(siteInfo, diagProvider, flowMgr) {
        addSubnetSelectionDropDownView(siteInfo, diagProvider, flowMgr, "Please select the subnet you want to delete", async (subnet, vnet) => {
            var wordings = new SubnetDeletionWordings();
            var lockPromise = checkSubnetLocksAsync(subnet, siteInfo, diagProvider, flowMgr);
            flowMgr.addViews(lockPromise.then(r => r.views), "Checking locks...");
            var isContinue = (await lockPromise).isContinue;
            if (!isContinue) {
                return;
            }
            var salPromise = checkSalAsync(vnet, subnet, siteInfo, diagProvider, flowMgr);
            flowMgr.addViews(salPromise.then(r => r.views), "Checking subnet usage...");
            var orphanedSal = (await salPromise).orphanedSal;
            if (orphanedSal != null) {
                flowMgr.addViews(wordings.orphanSalDetected.get(orphanedSal.id));
                flowMgr.logEvent("SubnetDeletionFlow.OrphanedSalDetected", {salId: orphanedSal.id});
            }
        })
    }
}

async function getSubnetLocksAsync(siteInfo, diagProvider, flowMgr) {
    try {
        var result = await diagProvider.getArmResourceAsync(`/subscriptions/${siteInfo.subscriptionId}/providers/Microsoft.Authorization/locks`, "2016-09-01");
        return result;
    } catch (e) {
        flowMgr.logException(e, "checkSubnetLocks");
        return null;
    }
}

async function checkSubnetLocksAsync(subnet, siteInfo, diagProvider, flowMgr) {
    var result = await getSubnetLocksAsync(siteInfo, diagProvider, flowMgr);
    var recommendations = new SubnetDeletionWordings();
    var views = [];
    var isContinue = true;
    if (result != null) {
        if (result.status == 200) {
            var locks = result.value;
            var regex = /\/providers\/Microsoft\.Authorization\/locks\/.*/;
            var subnetLocks = locks.filter(l => subnet.id.includes(l.id.replace(regex, "/")));
            if (subnetLocks.length > 0) {
                views.push(new CheckStepView({
                    title: "Subnet is locked",
                    level: 2
                }));
                views.push(recommendations.subnetIsLocked.get(subnetLocks, diagProvider.generateResourcePortalLink(`/subscriptions/${siteInfo.subscriptionId}/locks`)));
                isContinue = false;
            } else {
                views.push(new CheckStepView({
                    title: "Subnet is not locked",
                    level: 0
                }));
            }
        }
    }
    return { views, isContinue };
}

async function checkSalAsync(vnet, subnet, siteInfo, diagProvider, flowMgr) {
    var vnetResourceGuid = vnet.properties && vnet.properties.resourceGuid;
    if (vnetResourceGuid == null) {
        throw new Error("malformed vnet data");
    }
    var vnetId = vnetResourceGuid + "_" + subnet.name;
    var region = siteInfo.location.replaceAll(" ", "").toLowerCase();

    var sals = subnet.properties.serviceAssociationLinks;
    var wordings = new SubnetDeletionWordings();
    var views = [];
    var orphanedSal = null;
    var appsConnected = [];
    if (sals != null) {
        var appServiceSals = sals.filter(sal => sal.properties.linkedResourceType == "Microsoft.Web/serverfarms");
        if (appServiceSals.length > 0) {
            // for now, one subnet only can be integrated by apps in one app service plan
            if (appServiceSals.length > 1) {
                flowMgr.logException(new Error("unexpected multiple App Service Service Association Link"), "checkSalAsync");
            }
            var usageResult = await checkSubnetIntegrationUsageAsync(vnetId, region, siteInfo, diagProvider);
            views = views.concat(usageResult.views);
            if(usageResult.isContinue){
                orphanedSal = appServiceSals[0];
            }
        } else {
            views.push(new CheckStepView({
                title: "Subnet is not used by AppService",
                level: 0
            }));
            views.push(wordings.subnetIsNotUsedByAppService.get());
        }
    } else {
        views.push(new CheckStepView({
            title: "Subnet is not used by any Azure Service",
            level: 0
        }));
        views.push(wordings.subnetIsNotUsed.get());
    }
    return { views, orphanedSal };
}

async function checkSubnetIntegrationUsageAsync(vnetId, region, siteInfo, diagProvider) {
    var wordings = new SubnetDeletionWordings();
    var result = await diagProvider.getArmResourceAsync(siteInfo.resourceUri + `/detectors/checkSubnetIntegrationUsage?vnetId=${vnetId}&region=${region}`, undefined, true);
    var views = [];
    var isContinue = false;
    if (result.status == 200) {
        var dataset = result.properties.dataset;
        var tables = Object.fromEntries(dataset.map(s => [s.table.tableName, s.table]));
        if (tables["checkSubnetUsageByVnetId"] != null) {
            var t = tables["checkSubnetUsageByVnetId"];
            if (t.columns[0].columnName != "error") {
                var sites = JSON.parse(t.rows[0][0]);
                if (sites.length > 0) {
                    views = views.concat(wordings.subnetIsInUseBySites.get(sites, diagProvider.portalDomain));
                } else {
                    // no usage, orphaned
                    isContinue = true;
                }
            } else {
                var error = JSON.parse(t.rows[0][0]);
                throw new Error(t.rows[0][0]);
            }
        }
    } else {
        views.push(new CheckStepView({
            title: "Server error, please retry",
            level: 2,
            subChecks: null
        }));
        throw new Error(`unexpected response from detector: ${JSON.stringify(result)}`);
    }
    return { views, isContinue };
}