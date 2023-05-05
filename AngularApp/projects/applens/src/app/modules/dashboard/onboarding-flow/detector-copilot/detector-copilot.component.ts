import { Component, OnInit, OnChanges, Input, Output, EventEmitter, SimpleChanges } from '@angular/core';
import { PanelType } from 'office-ui-fabric-react';

@Component({
  selector: 'detector-copilot',
  templateUrl: './detector-copilot.component.html',
  styleUrls: ['./detector-copilot.component.scss']
})
export class DetectorCopilotComponent implements OnInit, OnChanges {

  @Input() openPanel: boolean = false;
  @Input() detectorCode: string = '';
  @Input() detectorOutput: string = '';

  @Output() onPanelClose = new EventEmitter();
  @Output() onCodeSuggestion = new EventEmitter<string>();

  panelType: PanelType = PanelType.medium;
  panelWidth: string = "500px";

  ngOnInit(): void {
    
  }

  ngOnChanges(changes: SimpleChanges): void {
  }

  dismissedHandler(): void {
    this.openPanel = false;
    this.onPanelClose.emit();
  }
}
