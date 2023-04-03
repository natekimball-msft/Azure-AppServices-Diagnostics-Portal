import { Component, OnInit } from '@angular/core';
import { NgFlowchart, NgFlowchartStepComponent } from 'projects/ng-flowchart/dist';

@Component({
  selector: 'architecture-diagram-node',
  templateUrl: './architecture-diagram-node.component.html',
  styleUrls: ['./architecture-diagram-node.component.scss']
})
export class ArchitectureDiagramNodeComponent extends NgFlowchartStepComponent {

  routes = [];
  nodeIconType: string = ""; 
  nodeIcon: string = ""; //default value  

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
    { name: "default", imgSrc: "assets/img/Default-Node-Image.svg"}

  ];

  iconTypeList = [
    "cloud"
  ]


  ngOnInit(): void{
    this.modifyData(); 
  }

  private modifyData(){
      //special ellipses modification for title overflow 
      if(this.data.title){
        this._modifyTitle(); 
      }
      this.data.icon = this._trimString(this.data.icon);
      this.data.status = this._trimString(this.data.status); 
      this._setIcon(); 
  }

  private _modifyTitle(){

    if(this.data.title.length > 24){
      this.data.title = this.data.title.substring(0,10) + "..." + this.data.title.substring(this.data.title.length - 12); 
    }
  }

  private _setIcon(){

    //check if this.data.icon exists or is empty 
    if(!this.data.icon || this.data.icon == ""){
      this.nodeIcon = this.resourceTypeList[11].imgSrc; //default icon
      this.nodeIconType = "image"; 
      return;
  }
  //if icon is cloud, use cloud icon 
    if(this.data.icon == "cloud"){
      this.nodeIcon = this.iconTypeList[0];
      this.nodeIconType = "icon"; 
    }
    else if(this.data.icon == "webapp"){
      this.nodeIcon = this.resourceTypeList[0].imgSrc;
      this.nodeIconType = "image"; 
    }
    else if(this.data.icon == "traffic"){
      this.nodeIcon = this.resourceTypeList[8].imgSrc;
      this.nodeIconType = "image"; 
    }
    else if(this.data.icon == "frontdoor"){
      this.nodeIcon = this.resourceTypeList[10].imgSrc;
      this.nodeIconType = "image"; 
    }
    else if(this.data.icon == "cloudservice"){
      this.nodeIcon = this.resourceTypeList[9].imgSrc;
      this.nodeIconType = "image"; 
    }
}

  private _trimString(str: string){
    //remove white spaces from string to handle empty content 
    if(str ){
      return str.trim(); 
    }
    return str; 

  }
  

}
