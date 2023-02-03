import { Component, OnInit } from '@angular/core';
import { NgFlowchart, NgFlowchartStepComponent } from 'projects/ng-flowchart/dist';

@Component({
  selector: 'architecture-diagram-node',
  templateUrl: './architecture-diagram-node.component.html',
  styleUrls: ['./architecture-diagram-node.component.scss']
})
export class ArchitectureDiagramNodeComponent extends NgFlowchartStepComponent {

  routes = [];

  canDrop(dropEvent: NgFlowchart.DropTarget): boolean {
    return true;
  }

  

  onAddRoute() {
    let route = {
      name: 'New Route',
      condition: '',
      sequence: null
    }
    let index = this.routes.push(route);
    route.sequence = index;

    this.addChild({
      template: ArchitectureDiagramNodeComponent, //another custom step
      type: 'do-action',
      data: route
    }, {
      sibling: true
    });
  }
  
  

  

}
