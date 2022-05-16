import { DetectorMetaData, DetectorResponse, ResiliencyScoreReportHelper } from 'diagnostic-data';
import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { ActivatedRoute, Params } from '@angular/router';
import { ApplensDiagnosticService } from '../../services/applens-diagnostic.service';
import { DetectorControlService } from 'diagnostic-data';
import { ApplensCommandBarService } from '../../services/applens-command-bar.service';
import { ApplensGlobal } from 'projects/applens/src/app/applens-global';
import { StartupService } from '../../../../shared/services/startup.service';
import { ResourceService } from '../../../../shared/services/resource.service';
import { ObserverService } from '../../../../shared/services/observer.service';



@Component({
  selector: 'tab-data',
  templateUrl: './tab-data.component.html',
  styleUrls: ['./tab-data.component.scss']
})
export class TabDataComponent implements OnInit {

  constructor(private _route: ActivatedRoute, private _startupService: StartupService, public resourceService: ResourceService,  private _observerService: ObserverService, private _diagnosticApiService: ApplensDiagnosticService, private _detectorControlService: DetectorControlService,private _applensCommandBarService:ApplensCommandBarService,private _applensGlobal:ApplensGlobal) { }

  detectorResponse: DetectorResponse;

  detector: string;

  error: any;

  analysisMode: boolean = false;

  hideDetectorControl: boolean = false;

  internalExternalText: string = "";
  internalViewText: string = "Internal view";
  externalViewText: string = "Customer view";

  // Variables used by Download Report button
  
  resourceReady: Observable<any>;
  resource: any;  
  displayDownloadReportButton: boolean = false;
  downloadReportText: string = "Get report";
  downloadReportIcon: any = { iconName: 'Download' };
  downloadReportButtonDisabled: boolean;
  downloadReportFileName: string;
  _isBetaSubscription: boolean = false;
  generatedOn: string;

  public _checkIsWindowsApp(): boolean {

    let serviceInputs = this._startupService.getInputs();
    this.resourceReady = this.resourceService.getCurrentResource();
    this.resourceReady.subscribe(resource => {
      if (resource) {  
        this.resource = resource;
        if (serviceInputs.resourceType.toString().toLowerCase() === 'microsoft.web/sites') {
          this._observerService.getSiteRequestDetails(this.resource.SiteName, this.resource.InternalStampName).subscribe(siteInfo => {            
            this.resource['IsWindows'] = siteInfo.details.islinux === false ? true : false;
            if (this.resource['IsWindows'] === true) {
              return true;
            }
            else {
              return false;
            }
        })      
        }
      }
    });
    return false;
  }    
   

  ngOnInit() {
    this._route.params.subscribe((params: Params) => {
      this.refresh();
    });
    // If route query params contains detectorQueryParams, setting the values in shared service so it is accessible in all components
    this._route.queryParams.subscribe((queryParams: Params) => {
      if (queryParams.detectorQueryParams != undefined) {
        this._detectorControlService.setDetectorQueryParams(queryParams.detectorQueryParams);
      } else {
        this._detectorControlService.setDetectorQueryParams("");
      }

      this.analysisMode = this._route.snapshot.data['analysisMode'];      
      this.displayDownloadReportButton = this._route.firstChild.firstChild.firstChild.firstChild.firstChild.snapshot.params["detector"] === "ResiliencyScore" && this._checkIsWindowsApp() ? true: false;
    });

    if (this._detectorControlService.isInternalView){
      this.internalExternalText = this.internalViewText;
    }
    else{
      this.internalExternalText = this.externalViewText;
    }
    
  }

  refresh() {
    this.detector = this._route.snapshot.params['detector'];
    this._diagnosticApiService.getDetectorMetaDataById(this.detector).subscribe(metaData => {
      if(metaData) {
        this._applensGlobal.updateHeader(metaData.name);
      }
    })
  }

  refreshPage() {
    this._applensCommandBarService.refreshPage();
  }

  emailToAuthor() {
    this._applensCommandBarService.getDetectorMeatData(this.detector).subscribe(metaData =>{
      this._applensCommandBarService.emailToAuthor(metaData);
    });
  }

  openFeedback() {
    this._applensGlobal.openFeedback = true;
  }

  internalExternalToggle(){
    if (this.internalExternalText === this.externalViewText){
      this.internalExternalText = this.internalViewText;
    }
    else{
      this.internalExternalText = this.externalViewText;
    }

    this._detectorControlService.toggleInternalExternal();
    this.refreshPage();
  }
}
