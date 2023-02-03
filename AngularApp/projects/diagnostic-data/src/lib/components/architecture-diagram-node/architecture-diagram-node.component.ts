import { Component, OnInit } from '@angular/core';
import { NgFlowchartStepComponent } from 'projects/ng-flowchart/dist';

@Component({
  selector: 'architecture-diagram-node',
  templateUrl: './architecture-diagram-node.component.html',
  styleUrls: ['./architecture-diagram-node.component.scss']
})
export class ArchitectureDiagramNodeComponent extends NgFlowchartStepComponent implements OnInit {

  

  ngOnInit(): void {
  }

}
