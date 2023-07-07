import { Component, OnInit, Input, Output, EventEmitter, OnChanges, ViewChild } from '@angular/core';
import { Options } from 'ng5-slider';
import { DaasService } from '../../../../services/daas.service';
import { SiteDaasInfo } from '../../../../models/solution-metadata';
import { MonitoringSession, RuleType, CpuMonitoringMode } from '../../../../models/daas';
import { IChoiceGroupOption } from 'office-ui-fabric-react/lib/components/ChoiceGroup';
import { IPivotProps } from 'office-ui-fabric-react';
import { CpuMonitoringRuleComponent } from '../cpu-monitoring-rule/cpu-monitoring-rule.component';

@Component({
  selector: 'cpu-monitoring-configuration',
  templateUrl: './cpu-monitoring-configuration.component.html',
  styleUrls: ['./cpu-monitoring-configuration.component.scss']
})
export class CpuMonitoringConfigurationComponent implements OnInit {

  @Input() siteToBeDiagnosed: SiteDaasInfo;
  @Input() activeSession: MonitoringSession;
  @Input() blobSasUri: string;

  @Output() monitoringConfigurationChange: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Output() savingMonitoringConfiguration: EventEmitter<boolean> = new EventEmitter<boolean>();

  @ViewChild('diagnosticRuleRef', { static: false }) diagnosticRuleRef: CpuMonitoringRuleComponent;
  @ViewChild('alwaysonRuleRef', { static: false }) alwaysonRuleRef: CpuMonitoringRuleComponent;

  chosenRuleType: RuleType = RuleType.Diagnostics;
  RuleType = RuleType;
  monitoringEnabled: boolean = false;

  savingSettings: boolean = false;
  error: any = null;
  editMode: boolean = false;

  pivotStyle: IPivotProps['styles'] = {
    root: {
    }
  }

  constructor(private _daasService: DaasService) {
  }

  ngOnInit() {
  }

  savingConfiguration(saving: boolean) {
    this.savingSettings = saving;
    this.savingMonitoringConfiguration.emit(saving);
  }

  updateConfiguration(updated: boolean) {
    this.monitoringConfigurationChange.emit(updated);
  }

  updateMonitoringEnabled(updated: boolean) {
    this.monitoringEnabled = updated;
  }

  checkForChanges() {
    if (this.chosenRuleType === RuleType.AlwaysOn) {
      this.alwaysonRuleRef.checkForChanges(this.monitoringEnabled);
    } else {
      this.diagnosticRuleRef.checkForChanges(this.monitoringEnabled);
    }
  }

  saveCpuMonitoring() {
    if (this.chosenRuleType === RuleType.AlwaysOn) {
      this.alwaysonRuleRef.saveCpuMonitoring();
    } else {
      this.diagnosticRuleRef.saveCpuMonitoring();
    }
  }

  updateEditMode(event: boolean) {
    this.editMode = event;
  }
}
