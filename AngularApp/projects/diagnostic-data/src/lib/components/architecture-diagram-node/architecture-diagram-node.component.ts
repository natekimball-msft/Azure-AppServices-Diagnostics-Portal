import { Component, OnInit } from '@angular/core';
import { NgFlowchart, NgFlowchartStepComponent } from 'projects/ng-flowchart/dist';
import {
  DocumentCard,
  DocumentCardPreview,
  DocumentCardTitle,
  DocumentCardActivity,
  IDocumentCardPreviewProps
} from 'office-ui-fabric-react/lib/DocumentCard';
import { title } from 'process';
import {MatCardModule} from '@angular/material/card';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';


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
    { name: "endpoint", imgSrc: "assets/img/Cloud-Service-Logo.svg" }
  ];


  ngOnInit(): void{
    console.log("in here:" , this.data); 
    console.log("in here 2: ", this.canvas.flow); 
    debugger; 
  }

  // public render(): JSX.Element {
  //   const previewProps: IDocumentCardPreviewProps = {
  //     previewImages: [
  //       {
  //         previewImageSrc: String(require('./document-preview.png')),
  //         iconSrc: String(require('./icon-ppt.png')),
  //         width: 318,
  //         height: 196,
  //         accentColor: '#ce4b1f'
  //       }
  //     ],
  //   };
  
  //   return (
  //     <DocumentCard onClickHref='http://bing.com'>
  //       <DocumentCardPreview { ...previewProps } />
  //       <DocumentCardTitle title='Revenue stream proposal fiscal year 2016 version02.pptx' />
  //       <DocumentCardActivity
  //         activity='Created Feb 23, 2016'
  //         people={
  //           [
  //             { name: 'Kat Larrson', profileImageSrc: String(require('./avatar-kat.png')) }
  //           ]
  //         }
  //       />
  //     </DocumentCard>
  //   );
  // }
  

  // canDrop(dropEvent: NgFlowchart.DropTarget): boolean {
  //   return true;
  // }

  

  // onAddRoute() {
  //   let route = {
  //     name: 'New Route',
  //     condition: '',
  //     sequence: null
  //   }
  //   let index = this.routes.push(route);
  //   route.sequence = index;

  //   this.addChild({
  //     template: ArchitectureDiagramNodeComponent, //another custom step
  //     type: 'do-action',
  //     data: route
  //   }, {
  //     sibling: true
  //   });
  // }
  
  

  

}
