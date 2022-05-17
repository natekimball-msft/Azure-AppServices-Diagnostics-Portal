import { DetectorMetaData, DetectorResponse, ResiliencyScoreReportHelper, TelemetryService, TelemetryEventNames } from 'diagnostic-data';
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
import { SeverityLevel } from '@microsoft/applicationinsights-web';
import { DirectionalHint } from 'office-ui-fabric-react';



@Component({
  selector: 'tab-data',
  templateUrl: './tab-data.component.html',
  styleUrls: ['./tab-data.component.scss']
})
export class TabDataComponent implements OnInit {

  constructor(private _route: ActivatedRoute, private _startupService: StartupService, public resourceService: ResourceService,  private _observerService: ObserverService, private telemetryService: TelemetryService, private _diagnosticApiService: ApplensDiagnosticService, private _detectorControlService: DetectorControlService,private _applensCommandBarService:ApplensCommandBarService,private _applensGlobal:ApplensGlobal) { }

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
  downloadReportId: string;
  downloadReportText: string = "Download report";
  downloadReportIcon: any = { iconName: 'Download' };
  downloadReportButtonDisabled: boolean;
  downloadReportFileName: string;
  coachmarkId: string;  
  showCoachmark: boolean = true;
  showTeachingBubble: boolean = false;
  generatedOn: string;
  coachmarkPositioningContainerProps = {
    directionalHint: DirectionalHint.bottomLeftEdge,
    doNotLayer: true
  };
  teachingBubbleCalloutProps = {
    directionalHint: DirectionalHint.bottomLeftEdge
  };

  

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
      this.detector = this._route.snapshot.params['detector'];         
      this.displayDownloadReportButton = this.detector === "ResiliencyScore" && this._checkIsWindowsApp() ? true: false;
      this.telemetryService.logEvent(TelemetryEventNames.DownloadReportButtonDisplayed, { 'DownloadReportButtonDisplayed': this.displayDownloadReportButton.toString(), 'Detector:': this.detector, 'SubscriptionId': this._route.parent.snapshot.params['subscriptionid'], 'Resource': this.resource.SiteName });
    });

    if (this._detectorControlService.isInternalView){
      this.internalExternalText = this.internalViewText;
    }
    else{
      this.internalExternalText = this.externalViewText;
    }
    const loggingError = new Error();
    this.downloadReportButtonDisabled = false;
        //Get showCoachMark value(string) from local storage (if exists), then convert to boolean   
        try {
          if (this.displayDownloadReportButton){
            if (localStorage.getItem("showCoachmark") != undefined) {
              this.showCoachmark = localStorage.getItem("showCoachmark") === "true";
            }
            else {
              this.showCoachmark = true;
            }
          }
        }
        catch (error) {
          loggingError.message = 'Error trying to retrieve showCoachmark from localStorage';
          loggingError.stack = error;
          let _severityLevel: SeverityLevel = SeverityLevel.Warning;
          this.telemetryService.logException(loggingError, null, null, _severityLevel);
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

  ngAfterViewInit() {
    // Async to get button element after grandchild is rendered
    setTimeout(() => {
      this.updateDownloadReportId();
    });
  }


  updateDownloadReportId() {
    const btns = document.querySelectorAll("#fab-command-bar button");
    const downloadButtonId = "downloadReportId";
    const coachMarkId = "fab-coachmark";
    let downloadButtonIndex = -1;
    if (btns && btns.length > 0) {
      btns.forEach((btn,i) => {
        if(btn.textContent.includes(this.downloadReportText)) {
          downloadButtonIndex = i;
        }
      });
      
      if(downloadButtonIndex >= 0 && downloadButtonIndex < btns.length && btns[downloadButtonIndex]) {
        const downloadButton = btns[downloadButtonIndex];
        downloadButton.setAttribute("id", downloadButtonId);
      }
    }

    this.downloadReportId = `#${downloadButtonId}`;
    this.coachmarkId = `#${coachMarkId}`;
  }


  downloadReport() {
    // Once the button is clicked no need to show Coachmark anymore:
    const loggingError = new Error();
    try {
      if (localStorage.getItem("showCoachmark") != undefined) {
        this.showCoachmark = localStorage.getItem("showCoachmark") === "true";
      }
      else {
        this.showCoachmark = false;
        localStorage.setItem("showCoachmark", "false");
      }
    }
    catch (error) {
      //Use TelemetryService logException
      loggingError.message = 'Error accessing localStorage. Most likely accessed via in InPrivate or Incognito mode';
      loggingError.stack = error;
      let _severityLevel: SeverityLevel = SeverityLevel.Warning;
      this.telemetryService.logException(loggingError, null, null, _severityLevel);
    }
    // Taking starting time
    let sT = new Date();
    this.downloadReportText = "Getting Resiliency Score report...";
    this.downloadReportIcon = {
      iconName: 'Download',
      styles: {
        root: {
          color: 'grey'
        }
      }
    };
    this.downloadReportButtonDisabled = true;    

    if (this._route.snapshot.params['detector']) {
      this.detector = this._route.snapshot.params['detector'];
    }
    else {
      this.detector = this._route.parent.snapshot.params['detector'];
    }
    let allRouteQueryParams = this._route.snapshot.queryParams;
    let additionalQueryString = '';
    let knownQueryParams = ['startTime', 'endTime'];
    Object.keys(allRouteQueryParams).forEach(key => {
      if (knownQueryParams.indexOf(key) < 0) {
        additionalQueryString += `&${key}=${encodeURIComponent(allRouteQueryParams[key])}`;
      }
    });


    this._diagnosticApiService.getDetector("ResiliencyScore", this._detectorControlService.startTimeString, this._detectorControlService.endTimeString, this._detectorControlService.shouldRefresh, this._detectorControlService.isInternalView, additionalQueryString)
      .subscribe((httpResponse: DetectorResponse) => {            
        //If the page hasn't been refreshed this will use a cached request, so changing File Name to use the same name + "(cached)" to let them know they are seeing a cached version.
        let eT = new Date();
        let detectorTimeTaken = eT.getTime() - sT.getTime();
        if (this.downloadReportFileName == undefined) {
          this.generatedOn = ResiliencyScoreReportHelper.generatedOn();
          this.downloadReportFileName = `ResiliencyReport-${JSON.parse(httpResponse.dataset[0].table.rows[0][0]).CustomerName}-${this.generatedOn.replace(":", "-")}`;
          ResiliencyScoreReportHelper.generateResiliencyReport(httpResponse.dataset[0].table, `${this.downloadReportFileName}`, this.generatedOn);
        }
        else {
          this.downloadReportFileName = `${this.downloadReportFileName}`;
          ResiliencyScoreReportHelper.generateResiliencyReport(httpResponse.dataset[0].table, `${this.downloadReportFileName}_(cached)`, this.generatedOn);
        }
        // Time after downloading report
        eT = new Date();
        // Estimate total time it took to download report
        let totalTimeTaken = eT.getTime() - sT.getTime();
        // log telemetry for interaction
        const eventProperties = {
          'Subscription': this._route.parent.snapshot.params['subscriptionid'],
          'CustomerName': JSON.parse(httpResponse.dataset[0].table.rows[0][0]).CustomerName,
          'NameSite1': JSON.parse(httpResponse.dataset[0].table.rows[1][0])[0].Name,
          'ScoreSite1': JSON.parse(httpResponse.dataset[0].table.rows[1][0])[0].OverallScore,
          'DetectorTimeTaken': detectorTimeTaken.toString(),
          'TotalTimeTaken': totalTimeTaken.toString()
        };
        this.telemetryService.logEvent(TelemetryEventNames.DownloadReportButtonClicked, eventProperties);
        this.downloadReportText = "Download report";
        this.downloadReportIcon = { iconName: 'Download' };
        this.downloadReportButtonDisabled = false;
      }, error => {
        loggingError.message = `Error calling ${this.detector} detector`;
        loggingError.stack = error;
        this.telemetryService.logException(loggingError);
      });    
  }  

  
  coachMarkViewed() {
    const loggingError = new Error();
    // Stop showing TeachingBubble
    this.showTeachingBubble = false;

    //Once Coachmark has been seen, disable it by setting boolean value to local storage
    try {
      localStorage.setItem("showCoachmark", "false");
    }
    catch (error) {
      //Use TelemetryService logException
      loggingError.message = 'Error accessing localStorage. Most likely accessed via in InPrivate or Incognito mode';
      loggingError.stack = error;
      let _severityLevel: SeverityLevel = SeverityLevel.Warning;
      this.telemetryService.logException(loggingError, null, null, _severityLevel);
    }
  }

  showingTeachingBubble(){
    if (this.displayDownloadReportButton){
      this.showTeachingBubble = true;
    }  
  }
}



