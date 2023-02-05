import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ConsoleService } from '@ng-select/ng-select/lib/console.service';
import { ConditionIffalseStepComponent } from 'projects/applens/src/app/modules/dashboard/workflow/condition-iffalse-step/condition-iffalse-step.component';
import { ConditionIftrueStepComponent } from 'projects/applens/src/app/modules/dashboard/workflow/condition-iftrue-step/condition-iftrue-step.component';
import { DetectorNodeComponent } from 'projects/applens/src/app/modules/dashboard/workflow/detector-node/detector-node.component';
import { IfElseConditionStepComponent } from 'projects/applens/src/app/modules/dashboard/workflow/ifelse-condition-step/ifelse-condition-step.component';
import { KustoNodeComponent } from 'projects/applens/src/app/modules/dashboard/workflow/kusto-node/kusto-node.component';
import { MarkdownNodeComponent } from 'projects/applens/src/app/modules/dashboard/workflow/markdown-node/markdown-node.component';
import { SwitchCaseDefaultStepComponent } from 'projects/applens/src/app/modules/dashboard/workflow/switch-case-default-step/switch-case-default-step.component';
import { SwitchCaseStepComponent } from 'projects/applens/src/app/modules/dashboard/workflow/switch-case-step/switch-case-step.component';
import { SwitchStepComponent } from 'projects/applens/src/app/modules/dashboard/workflow/switch-step/switch-step.component';
import { WorkflowRootNodeComponent } from 'projects/applens/src/app/modules/dashboard/workflow/workflow-root-node/workflow-root-node.component';
import { NgFlowchart, NgFlowchartCanvasDirective, NgFlowchartStepComponent, NgFlowchartStepRegistry } from 'projects/ng-flowchart/dist';
import { FlowFlags } from 'typescript';
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
  jsonArchitecture: any; 

  options: NgFlowchart.Options = {
    stepGap: 40,
    isSequential: false,
    rootPosition: 'TOP_CENTER',
    zoom: {
      mode: 'DISABLED'
    }

  };

  /*items = [
    {
      name: 'Logger',
      type: 'log',
      data: {
        name: 'Log',
        icon: { name: 'log-icon', color: 'blue' },
        config: {
          message: null,
          severity: null
        }
      }
    }
  ]
  */
 items = []; 


  constructor(private _diagnosticService: DiagnosticService,  private stepRegistry: NgFlowchartStepRegistry, private _router: Router,
    private _activatedRoute: ActivatedRoute, protected telemetryService: TelemetryService, private _navigator: FeatureNavigationService) { 
      super(telemetryService);
      console.log("in architecture-diagram-component constructor hehe"); 

  }


    
  ngAfterViewInit() {
    //created from standared ng-template refs
    // this.stepRegistry.registerStep('markdown', ArchitectureDiagramNodeComponent);
    this.stepRegistry.registerStep('sample-step', ArchitectureDiagramNodeComponent);
    this.stepRegistry.registerStep('do-action', ArchitectureDiagramNodeComponent);

    this.stepRegistry.registerStep('notification', ArchitectureDiagramNodeComponent);
    //this.stepRegistry.registerStep('undefined', ArchitectureDiagramNodeComponent);

    
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

    debugger; 

    if(this.canvas == undefined){
      console.log("canvas undefined")
      return; 
    }
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
    this.jsonArchitecture = JSON.parse(this.architecture); 
    //console.log(this.jsonArchitecture); 
    this.architectureObj = this.jsonArchitecture; 
    //console.log(typeof(this.architectureObj)); 

    let flow = this.canvas.getFlow();

    
    //console.log(this.architecture); 
    debugger; 
    //console.log(Object.keys(this.jsonArchitecture)); 

    //console.log(this.jsonArchitecture["root"]); 


    /*this.jsonArchitectureArr.push(this.jsonArchitecture["root"]);

    for(let i = 0; i < this.jsonArchitecture["root"]["children"].length; i++){
      console.log(this.jsonArchitecture["root"]["children"][i]); 
      this.jsonArchitectureArr.push(this.jsonArchitecture["root"]["children"][i]);

    }
    */

    console.log(this.canvas.getFlow().getRoot());
    console.log(this.canvas.getFlow().toJSON());


    debugger; 

    flow.upload(this.architecture);
    
    debugger; 

    //flow.render(); 
    
   
    // let currentflow = flow.toJSON(); 


    
  }

  showRender(){
    this.canvas.getFlow().render(); 
  }


}
