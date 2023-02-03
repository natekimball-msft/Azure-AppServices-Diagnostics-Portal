import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgFlowchart, NgFlowchartCanvasDirective, NgFlowchartStepComponent, NgFlowchartStepRegistry } from 'projects/ng-flowchart/dist';
import { DataTableResponseObject, DiagnosticData, Rendering } from '../../models/detector';
import { DiagnosticService } from '../../services/diagnostic.service';
import { FeatureNavigationService } from '../../services/feature-navigation.service';
import { TelemetryService } from '../../services/telemetry/telemetry.service';
import { DataRenderBaseComponent } from '../data-render-base/data-render-base.component';

@Component({
  selector: 'architecture-diagram',
  templateUrl: './architecture-diagram.component.html',
  styleUrls: ['./architecture-diagram.component.scss']
})
export class ArchitectureDiagramComponent extends DataRenderBaseComponent implements OnInit{

@ViewChild(NgFlowchartCanvasDirective)
canvas: NgFlowchartCanvasDirective;





  architecture : string = ""; 


  constructor(private _diagnosticService: DiagnosticService,  private stepRegistry: NgFlowchartStepRegistry, private _router: Router,
    private _activatedRoute: ActivatedRoute, protected telemetryService: TelemetryService, private _navigator: FeatureNavigationService) { 
      super(telemetryService);
      console.log("in architecture-diagram-component constructor hehe"); 

  }


    
  ngAfterViewInit() {
    //created from standared ng-template refs
    debugger; 
    this.stepRegistry.registerStep('markdown', NgFlowchartStepComponent);
    this.stepRegistry.registerStep('markdown', NgFlowchartStepComponent);

    
    //created from custom component
    //this.stepRegistry.registerStep('router', CustomRouterStepComponent);

    super.ngOnInit(); 
  }

  
  protected processData(data: DiagnosticData) {
    super.processData(data);
   
    this.parseData(data.table);

    
  }

   // parses the incoming data to render a form
   private parseData(data: DataTableResponseObject) {

    if(this.canvas == undefined){
      return; 
    }
    debugger; 
    let numRows = data.rows.length; 
     
    //numRows should always be one 
    //the first element should always thus contain the json string 
    //for safety purposes, implement for loop and null check  
    //only one column 

    for(let i = 0; i < numRows; i++){
      if(data.rows[i]){
        
        let tempString = data.rows[i][0]; 
        this.architecture =  tempString.replace("'\n'", ""); 
        

      }
    }
    let jsonArchitecture = JSON.parse(this.architecture); 
    console.log(jsonArchitecture); 


    this.canvas.getFlow().upload(jsonArchitecture);
    
  }


}
