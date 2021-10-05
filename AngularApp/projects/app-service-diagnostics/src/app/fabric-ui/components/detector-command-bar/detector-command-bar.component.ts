import {
  DetectorControlService, DiagnosticService, DetectorMetaData, DetectorResponse, TelemetryService,TelemetryEventNames, TelemetrySource
} from 'diagnostic-data';
import { forkJoin, Observable, of } from 'rxjs';
import { Component, AfterViewInit, EventEmitter, Output, Input } from '@angular/core';
import { Globals } from '../../../globals';
import { ActivatedRoute, Router } from '@angular/router';
import {  } from 'diagnostic-data';
import * as pdfMake from "pdfmake/build/pdfmake";
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
import { ResiliencyReportData, ResiliencyResource, ResiliencyFeature } from '../resiliencyReportData';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'detector-command-bar',
  templateUrl: './detector-command-bar.component.html',
  styleUrls: ['./detector-command-bar.component.scss']
})
export class DetectorCommandBarComponent implements AfterViewInit{
  @Input() disableGenie:boolean=false;
  time: string;
  detector: DetectorMetaData;
  fullReportPath: string;
  resiliencyReportData: ResiliencyReportData;
  localResponse: 'assets/response.temp.json'

  constructor(private globals: Globals, private _detectorControlService: DetectorControlService, private _diagnosticService: DiagnosticService, private _route: ActivatedRoute, private router: Router, private telemetryService:TelemetryService, private http: HttpClient) { }
  toggleOpenState() {    
    this.telemetryService.logEvent(TelemetryEventNames.OpenGenie,{
      'Location':TelemetrySource.CategoryPage
    })
    this.globals.openGeniePanel = !this.globals.openGeniePanel;
  }

  sendFeedback() {
    this.telemetryService.logEvent(TelemetryEventNames.OpenFeedbackPanel,{
      'Location': TelemetrySource.CategoryPage
    });
    this.globals.openFeedback = !this.globals.openFeedback;
  }
  getLocalResponse() {
    return this.http.get(this.localResponse)
  }
  generateResiliencyPDF(){
    
    console.log("Calling ResiliencyScore detector");
    this.getLocalResponse

    this._diagnosticService.getDetector("ResiliencyScore", this._detectorControlService.startTimeString, this._detectorControlService.endTimeString).subscribe(response => {
    console.log("ResiliencyScore detector call finished");
    console.log(response);  
    let dataset = response.dataset;
    let table = dataset[0].table;
    let rows = table.rows;
    var cName = JSON.stringify(rows[0][1], ["CustomerName"]);      
    var resiliencyReportData = new ResiliencyReportData(cName);
    //resiliencyReportData.resiliencyResourceList[]
    // this.detector = response.metadata;
    // this.fullReportPath = `detectors/${this.detector.id}`;
    // this.processDetectorResponse(response).subscribe(() => {
    //   this.onComplete.emit({ status: true })
    //   (<any>pdfMake).vfs = pdfFonts.pdfMake.vfs;;
    // });
  });
  
 
  //this.telemetryService.logEvent(TelemetryEventNames.OpenFeedbackPanel,{
  //  'Location': TelemetrySource.CategoryPage
  //});
}  
  refreshPage() {
    let childRouteSnapshot = this._route.firstChild.snapshot;
    let childRouteType = childRouteSnapshot.url[0].toString();

    let instanceId = childRouteType === "overview" ? this._route.snapshot.params["category"] : (this._route.snapshot.params["category"] === "DiagnosticTools" ? childRouteSnapshot.url[1].toString(): childRouteType === "detectors" ? childRouteSnapshot.params["detectorName"] : childRouteSnapshot.params["analysisId"]);
    let isDiagnosticToolUIPage = this._route.snapshot.params["category"] === "DiagnosticTools" && childRouteType !== "overview" && instanceId !== "eventviewer" && instanceId !== "freblogs";

    const eventProperties = {
      'Category':this._route.snapshot.params['category'],
      'Location': TelemetrySource.CategoryPage
    };
    if (childRouteType === "detectors") {
      eventProperties['Detector'] = childRouteSnapshot.params['detectorName'];
      eventProperties['Type'] = 'detector';
    }else if(childRouteType === "analysis"){
      eventProperties['Analysis'] = childRouteSnapshot.params["analysisId"];
      eventProperties['Type'] = 'analysis';
    }else if (childRouteType === "overview") {
      eventProperties['Type'] = 'overview';
    }else if (this._route.snapshot.params["category"] === "DiagnosticTools") {
        eventProperties['Type'] = 'DiagnosticTools';
        eventProperties['Tool'] = instanceId ? instanceId : "";
    }

    this.telemetryService.logEvent(TelemetryEventNames.RefreshClicked,eventProperties);
    if (isDiagnosticToolUIPage)
    {
        // Currently there is no easy way to force reloading the static UI child component under DiagnosticTools Category
        this.router.navigate(['overview'], { relativeTo: this._route, skipLocationChange: true}).then(() => this.router.navigate([`tools/${instanceId}`], { relativeTo: this._route}));
    }
    else if (instanceId)
    {
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
    // Async to get button element after grandchild is renderded
    setTimeout(()=>{
      this.updateAriaExpanded();
    });
  }


  updateAriaExpanded(){
    const btns = document.querySelectorAll("#fab-command-bar button");
    if(btns && btns.length > 0) {
      const dropdown = btns[btns.length - 1];
      dropdown.setAttribute("aria-expanded",`${this.globals.openTimePicker}`);
    }
  }
}
