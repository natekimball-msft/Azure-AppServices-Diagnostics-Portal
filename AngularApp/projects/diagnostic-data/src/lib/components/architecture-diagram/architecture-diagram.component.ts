import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MarkdownNodeComponent } from 'projects/applens/src/app/modules/dashboard/workflow/markdown-node/markdown-node.component';
import { NgFlowchart, NgFlowchartCanvasDirective, NgFlowchartStepComponent, NgFlowchartStepRegistry } from 'projects/ng-flowchart/dist';
import { DataTableResponseObject, DiagnosticData, Rendering } from '../../models/detector';
import { DiagnosticService } from '../../services/diagnostic.service';
import { FeatureNavigationService } from '../../services/feature-navigation.service';
import { TelemetryService } from '../../services/telemetry/telemetry.service';
import { ArchitectureDiagramNodeComponent } from '../architecture-diagram-node/architecture-diagram-node.component';
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
  architectureObj : any; 
  jsonArchitectureArr : any = []; 
  disabled = false;




  constructor(private _diagnosticService: DiagnosticService,  private stepRegistry: NgFlowchartStepRegistry, private _router: Router,
    private _activatedRoute: ActivatedRoute, protected telemetryService: TelemetryService, private _navigator: FeatureNavigationService) { 
      super(telemetryService);
      console.log("in architecture-diagram-component constructor hehe"); 

  }


    
  ngAfterViewInit() {
    //created from standared ng-template refs
    debugger; 
    // this.stepRegistry.registerStep('markdown', ArchitectureDiagramNodeComponent);
    this.stepRegistry.registerStep('sample-step', ArchitectureDiagramNodeComponent);
    this.stepRegistry.registerStep('do-action', ArchitectureDiagramNodeComponent);

    this.stepRegistry.registerStep('notification', ArchitectureDiagramNodeComponent);

    
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
    this.architectureObj = jsonArchitecture; 
    console.log(typeof(this.architectureObj)); 

    let flow = this.canvas.getFlow();
    console.log(this.architecture); 
    debugger; 
    console.log(Object.keys(jsonArchitecture)); 

    console.log(jsonArchitecture["root"]); 


    this.jsonArchitectureArr.push(jsonArchitecture["root"]);

    for(let i = 0; i < jsonArchitecture["root"]["children"].length; i++){
      console.log(jsonArchitecture["root"]["children"][i]); 
      this.jsonArchitectureArr.push(jsonArchitecture["root"]["children"][i]);

    }

    flow.upload(this.architecture);
    debugger; 
    let currentflow = flow.toJSON(); 
    
  }


}
