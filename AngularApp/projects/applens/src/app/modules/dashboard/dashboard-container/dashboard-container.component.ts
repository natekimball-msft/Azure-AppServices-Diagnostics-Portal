import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable, Subscription } from 'rxjs';
import { ApplensGlobal } from '../../../applens-global';
import { DiagnosticApiService } from '../../../shared/services/diagnostic-api.service';
import { ObserverService } from '../../../shared/services/observer.service';
import { ResourceService } from '../../../shared/services/resource.service';
import { StartupService } from '../../../shared/services/startup.service';
import { AppLensCloudRegionUtility, AppLensCloudRegion } from '../../../shared/utilities/applens-cloud-region-utility';

@Component({
  selector: 'dashboard-container',
  templateUrl: './dashboard-container.component.html',
  styleUrls: ['./dashboard-container.component.scss']
})

export class DashboardContainerComponent implements OnInit {

  keys: string[];
  keyPairs: [string, string][] = [];
  resource: any;
  resourceReady: Observable<any>;
  resourceDetailsSub: Subscription;
  observerLink: string = "";
  stampAppLensLink: string = "";
  ascResourceExplorerLink:string = "";
  showMetrics: boolean = true;

    constructor(public _resourceService: ResourceService, private _startupService: StartupService, private _diagnosticApiService: DiagnosticApiService, private _observerService: ObserverService, private _applensGlobal: ApplensGlobal,  private _activatedRoute: ActivatedRoute) {
    let caseNumber = this._activatedRoute.snapshot.queryParams['caseNumber']? this._activatedRoute.snapshot.queryParams['caseNumber']: (this._activatedRoute.snapshot.queryParams['srId']? this._activatedRoute.snapshot.queryParams['srId']: null);
    if(caseNumber && AppLensCloudRegionUtility.getASCCloudSpecificBaseUri()) {
      this.ascResourceExplorerLink = AppLensCloudRegionUtility.getASCCloudSpecificBaseUri() + "/resourceexplorerv2?srId=" + caseNumber;
    }
  }

  ngOnInit() {
    this.showMetrics = !(this._resourceService.overviewPageMetricsId == undefined || this._resourceService.overviewPageMetricsId == "");
    let serviceInputs = this._startupService.getInputs();
    this.resourceReady = this._resourceService.getCurrentResource();
    this._applensGlobal.updateHeader("");
    this.resourceReady.subscribe(resource => {
      if (resource) {
        this.resource = resource;

        if (serviceInputs.resourceType.toString().toLowerCase() === 'microsoft.web/hostingenvironments' && this.resource && this.resource.Name) {
          this.observerLink = "https://wawsobserver.azurewebsites.windows.net/MiniEnvironments/" + this.resource.Name;
        }
        else if (serviceInputs.resourceType.toString().toLowerCase() === 'microsoft.web/sites') {
          this._diagnosticApiService.GeomasterServiceAddress = this.resource["GeomasterServiceAddress"];
          this._diagnosticApiService.GeomasterName = this.resource["GeomasterName"];
          this._diagnosticApiService.Location = this.resource["WebSpace"];
          this.observerLink = "https://wawsobserver.azurewebsites.windows.net/sites/" + this.resource.SiteName;

          if (resource['IsXenon']) {
            this._resourceService.imgSrc = this._resourceService.altIcons['Xenon'];
          }
        } else if (serviceInputs.resourceType.toString().toLowerCase() === 'microsoft.web/containerapps' ||
          serviceInputs.resourceType.toString().toLowerCase() === 'microsoft.app/containerapps') {
          this._diagnosticApiService.GeomasterServiceAddress = this.resource.ServiceAddress;
          this._diagnosticApiService.GeomasterName = this.resource.GeoMasterName;
          this.observerLink = "https://wawsobserver.azurewebsites.windows.net/partner/containerapp/" + this.resource.ContainerAppName;
        } else if (serviceInputs.resourceType.toString().toLowerCase() === 'microsoft.web/staticsites') {
          this.observerLink = "https://wawsobserver.azurewebsites.windows.net/staticwebapps/" + this.resource["DefaultHostname"];
        }

        this.keys = Object.keys(this.resource);
        if (this.keys.indexOf('StampName')>=0){
          this.stampAppLensLink = `${window.location.origin}/stamps/${this.resource.StampName}`;
        }
        this.keys.sort((a,b) => a.localeCompare(b));
        this.replaceResourceEmptyValue();
        if (serviceInputs.resourceType.toString().toLowerCase() == "stamps") {
          this.updateAdditionalStampInfo();
        }
        else {
          this.updateVentAndLinuxInfo();
        }
        this.updateAscLink();
        this.convertKeyToKeyPairs(this.keys);
      }
    });
  }

  updateAscLink() {
    if(this.ascResourceExplorerLink && this.resource!= null ) {
          this.resource['ASCLink'] = `<a href="${this.ascResourceExplorerLink}" target="_blank">Resource Explorer<i class="hyper-link-icon ml-1" aria-hidden="true"></i></a>`;
          this.keys.push('ASCLink');
    }
  }

  updateAdditionalStampInfo() {
    if (this.keys.indexOf('JarvisDashboard') == -1 && this.resourceReady != null && this.resourceDetailsSub == null) {
      this.resourceDetailsSub = this.resourceReady.subscribe(resource => {
        if (resource) {
          this._resourceService.getAdditionalResourceInfo(this.resource).subscribe(resourceInfo => {
            for (let key in resourceInfo) {
              this.resource[key] = resourceInfo[key];
              this.keys.push(key);
            };
            this.replaceResourceEmptyValue();
          });
        }
      });
    }
  }

  updateVentAndLinuxInfo() {
    if (this.keys.indexOf('VnetName') == -1 && this.resourceReady != null && this.resourceDetailsSub == null) {
      this.resourceDetailsSub = this.resourceReady.subscribe(resource => {
        if (resource) {
          this._observerService.getSiteRequestDetails(this.resource.SiteName, this.resource.InternalStampName).subscribe(siteInfo => {
            this.resource['VnetName'] = siteInfo.details.vnetname;
            this.keys.push('VnetName');

            if (this.resource['IsLinux']) {
              this.resource['LinuxFxVersion'] = siteInfo.details.linuxfxversion;
              this.keys.push('LinuxFxVersion');
            }

            this.replaceResourceEmptyValue();
          });
        }
      });
    }
  }

  replaceResourceEmptyValue() {
    this.keys.forEach(key => {
      if (this.resource[key] === "") {
        this.resource[key] = "N/A";
      }
    });
  }

  openFeedback() {
    this._applensGlobal.openFeedback = true;
  }

  copyToClipboard(item, event) {
    navigator.clipboard.writeText(item).then(_ => {
      event.target.src = "/assets/img/copy-icon-copied.png";
    });
    setTimeout(() => {
      event.target.src = "/assets/img/copy-icon.png";
    }, 3000);
  }

  checkWithHref(s: string) {
    return `${s}`.includes("a href");
  }

  private convertKeyToKeyPairs(keys: string[]) {
    for (let i = 0; i < keys.length; i += 2) {
      if (keys.length % 2 === 1 && i === keys.length - 1) {
        this.keyPairs.push([keys[i], ""]);
      } else {
        this.keyPairs.push([keys[i], keys[i + 1]]);
      }
    }
  }

  checkUseEmbeddedHTML(s: any) {
    return `${s}`.trim().startsWith("<a") && `${s}`.trim().endsWith("</a>");
  }
}
