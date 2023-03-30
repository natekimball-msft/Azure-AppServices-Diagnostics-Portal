import { Component, OnInit } from '@angular/core';
import { NgFlowchart, NgFlowchartStepComponent } from 'projects/ng-flowchart/dist';

@Component({
  selector: 'architecture-diagram-node',
  templateUrl: './architecture-diagram-node.component.html',
  styleUrls: ['./architecture-diagram-node.component.scss']
})
export class ArchitectureDiagramNodeComponent extends NgFlowchartStepComponent {

  routes = [];

  resourceTypeList = [
    { name: "webapp", imgSrc: "assets/img/Azure-WebApps-Logo.png" },
    { name: "Linux App", imgSrc: "assets/img/Azure-Tux-Logo.png" },
    { name: "Function App", imgSrc: "assets/img/Azure-Functions-Logo.png" },
    { name: "Logic App", imgSrc: "assets/img/Azure-LogicAppsPreview-Logo.svg" },
    { name: "App Service Environment", imgSrc: "assets/img/ASE-Logo.jpg" },
    { name: "Virtual Machine", imgSrc: "assets/img/Icon-compute-21-Virtual-Machine.svg" },
    { name: "Container App", imgSrc: "assets/img/Azure-ContainerApp-Logo.png" },
    { name: "Internal Stamp", imgSrc: "assets/img/Cloud-Service-Logo.svg" },
    { name: "traffic", imgSrc: "assets/img/SupportTopicImages/traffic.png" },
    { name: "cloudservice", imgSrc: "assets/img/Cloud-Service-Logo.svg" },
    { name: "frontdoor", imgSrc: "assets/img/AzureFront-Doors.svg" },

  ];


  ngOnInit(): void{
    //special ellipses modification for title overflow 
    if(this.data.title){
      this._modifyTitle(); 
    }
  }

  private _modifyTitle(){

    if(this.data.title.length > 21){
      this.data.title = this.data.title.substring(0,10) + "..." + this.data.title.substring(this.data.title.length - 12); 
    }
  }
  

}
