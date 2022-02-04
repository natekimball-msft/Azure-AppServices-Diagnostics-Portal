import {
  DetectorControlService, DiagnosticService, DetectorMetaData, DetectorResponse, TelemetryService, TelemetryEventNames, TelemetrySource,
} from 'diagnostic-data';
import { forkJoin, Observable, of } from 'rxjs';
import { Component, AfterViewInit, EventEmitter, Output, Injectable, Input } from '@angular/core';
import { Globals } from '../../../globals';
import { ActivatedRoute, ChildActivationEnd, Router } from '@angular/router';
import * as pdfMake from "pdfmake/build/pdfmake";
import * as pdfFonts from  "pdfmake/build/vfs_fonts";
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { ResiliencyScoreReportHelper } from '../../../../../../diagnostic-data/src/lib/utilities/resiliencyScoreReportHelper';
import * as React from 'react';
import { FabCoachmarkComponent } from '../../lib/components/fab-coachmark/coachmark.component';
import { Event as NavigationEvent } from '@angular/router';
import { IButtonProps } from 'office-ui-fabric-react/lib/Button'
import { IPositioningContainerProps  } from 'office-ui-fabric-react/lib/PositioningContainer';
import { DirectionalHint } from 'office-ui-fabric-react';



@Component({
  selector: 'detector-command-bar',
  templateUrl: './detector-command-bar.component.html',
  styleUrls: ['./detector-command-bar.component.scss']
})
export class DetectorCommandBarComponent implements AfterViewInit {
  @Input() disableGenie: boolean = false;

  time: string;
  detector: DetectorMetaData;
  fullReportPath: string;

  gRPDFButtonChild: Element;
  gRPDFButtonId: string;
  gRPDFCoachmarkId: string;  
  gRPDFButtonText: string = "Get Resiliency Score Report";
  gRPDFButtonIcon: any = { iconName: 'Download' };
  gRPDFFileName: string;  
  gRPDFButtonDisabled: boolean;
  showCoachmark: boolean = true;
  showTeachingBubble: boolean = false;
  generatedOn: string;
  coachmarkPositioningContainerProps = {
    directionalHint: DirectionalHint.bottomLeftEdge,
    doNotLayer: true
  }
  teachingBubbleCalloutProps ={
    directionalHint: DirectionalHint.bottomLeftEdge
  };



  constructor(private globals: Globals, private _detectorControlService: DetectorControlService, private _diagnosticService: DiagnosticService, private _route: ActivatedRoute, private router: Router, private telemetryService: TelemetryService) { 
    this.gRPDFButtonDisabled = false;
    var st
    //Get showCoachMark value(string) from local storage (if exists), then convert to boolean   
    try {
      if (localStorage.getItem("showCoachmark")!=undefined)
      {
        this.showCoachmark = localStorage.getItem("showCoachmark") === "true";
      }    
      else
      {
        this.showCoachmark=true;
      }  
    }
    catch(e) {      
      }             
    }

  toggleOpenState() {
    this.telemetryService.logEvent(TelemetryEventNames.OpenGenie, {
      'Location': TelemetrySource.CategoryPage
    })
    this.globals.openGeniePanel = !this.globals.openGeniePanel;
  }

  sendFeedback() {
    this.telemetryService.logEvent(TelemetryEventNames.OpenFeedbackPanel, {
      'Location': TelemetrySource.CategoryPage
    });
    this.globals.openFeedback = !this.globals.openFeedback;
  }

  generateResiliencyPDF() {    
    // log telemetry for interaction

    // Once the button is clicked no need to show Coachmark anymore:
    try{      
      if (localStorage.getItem("showCoachmark")!=undefined)
      {
        this.showCoachmark = localStorage.getItem("showCoachmark") === "false";
      }
      else
      {
        this.showCoachmark=false;
        localStorage.setItem("showCoachmark","false");      
      }
    }
    catch(e) {      
    }
    this.gRPDFButtonText = "Getting Resiliency Score Report...";
    this.gRPDFButtonIcon = {
      iconName: 'Download',
      styles: {
        root:{
          color: 'grey'
        }
      }
     };
    this.gRPDFButtonDisabled = true;    
    
    var response = {
  };
  var customerName: string;

  
  this._diagnosticService.getDetector("ResiliencyScore", this._detectorControlService.startTimeString, this._detectorControlService.endTimeString)
  .subscribe((httpResponse: DetectorResponse) => {
        response = {
        metadata: httpResponse.metadata,
        dataset: httpResponse.dataset,
        status: httpResponse.status,
        dataProvidersMetadata: httpResponse.dataProvidersMetadata,
        suggestedUtterances: httpResponse.suggestedUtterances,
      };
      
      //If the page hasn't been refreshed this will use a cached request, so changing File Name to use the same name + "(cached)" to let them know they are seeing a cached version.
      if (this.gRPDFFileName == undefined)
      {
        this.generatedOn = ResiliencyScoreReportHelper.generatedOn();
        this.gRPDFFileName = `ResiliencyReport-${JSON.parse(httpResponse.dataset[0].table.rows[0][0]).CustomerName}-${this.generatedOn.replace(":","-")}`;
        ResiliencyScoreReportHelper.generateResiliencyReport(httpResponse.dataset[0].table, `${this.gRPDFFileName}`, this.generatedOn);
      }
      else
      {
          this.gRPDFFileName = `${this.gRPDFFileName}`;
          ResiliencyScoreReportHelper.generateResiliencyReport(httpResponse.dataset[0].table, `${this.gRPDFFileName}_(cached)`, this.generatedOn);
      }
      
      this.gRPDFButtonText = "Get Resiliency Score Report";
      this.gRPDFButtonIcon = { iconName: 'Download' };
      this.gRPDFButtonDisabled = false;
    },error => {
      //Use TelemetryService logException
      console.error(error);
    });

  }



  refreshPage() {
    let childRouteSnapshot = this._route.firstChild.snapshot;
    let childRouteType = childRouteSnapshot.url[0].toString();

    let instanceId = childRouteType === "overview" ? this._route.snapshot.params["category"] : (this._route.snapshot.params["category"] === "DiagnosticTools" ? childRouteSnapshot.url[1].toString() : childRouteType === "detectors" ? childRouteSnapshot.params["detectorName"] : childRouteSnapshot.params["analysisId"]);
    let isDiagnosticToolUIPage = this._route.snapshot.params["category"] === "DiagnosticTools" && childRouteType !== "overview" && instanceId !== "eventviewer" && instanceId !== "freblogs";

    const eventProperties = {
      'Category': this._route.snapshot.params['category'],
      'Location': TelemetrySource.CategoryPage
    };
    if (childRouteType === "detectors") {
      eventProperties['Detector'] = childRouteSnapshot.params['detectorName'];
      eventProperties['Type'] = 'detector';
    } else if (childRouteType === "analysis") {
      eventProperties['Analysis'] = childRouteSnapshot.params["analysisId"];
      eventProperties['Type'] = 'analysis';
    } else if (childRouteType === "overview") {
      eventProperties['Type'] = 'overview';
    } else if (this._route.snapshot.params["category"] === "DiagnosticTools") {
      eventProperties['Type'] = 'DiagnosticTools';
      eventProperties['Tool'] = instanceId ? instanceId : "";
    }

    this.telemetryService.logEvent(TelemetryEventNames.RefreshClicked, eventProperties);
    if (isDiagnosticToolUIPage) {
      // Currently there is no easy way to force reloading the static UI child component under DiagnosticTools Category
      this.router.navigate(['overview'], { relativeTo: this._route, skipLocationChange: true }).then(() => this.router.navigate([`tools/${instanceId}`], { relativeTo: this._route }));
    }
    else if (instanceId) {
      this._detectorControlService.refresh(instanceId);
    }
  }

  toggleOpenTimePicker() {
    this.globals.openTimePicker = !this.globals.openTimePicker;
    this.updateAriaExpanded();
  }

  updateMessage(s: string) {
    this.time = s;
  }

  closeTimePicker() {
    this.globals.openTimePicker = false;
  }

  ngAfterViewInit() {
    // Async to get button element after grandchild is rendered
    setTimeout(() => {
      this.updateAriaExpanded();
    });
  }


  updateAriaExpanded() {
    const btns = document.querySelectorAll("#fab-command-bar button");
    const pdfButtonId = "generatePDFButton";
    const coachMarkId = "fab-coachmark";
    if (btns && btns.length > 0) {
      const dropdown = btns[btns.length - 1];
      dropdown.setAttribute("aria-expanded", `${this.globals.openTimePicker}`);
      const PDFButton = btns[btns.length - 2];
      PDFButton.setAttribute("id", pdfButtonId);
    }

    this.gRPDFButtonId = `#${pdfButtonId}`;
    this.gRPDFCoachmarkId = `#${coachMarkId}`;
  }

  coachMarkViewed(){
    // Stop showing TeachingBubble
    this.showTeachingBubble=false;
    
    //Once Coachmark has been seen, disable it by setting boolean value to local storage
    try{
      localStorage.setItem("showCoachmark","false");
    }
    catch(e){      
    }
    
  }
}
