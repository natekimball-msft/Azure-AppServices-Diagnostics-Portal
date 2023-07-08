import { Component, EventEmitter, Input, OnChanges, OnInit, Output } from '@angular/core';
import { CpuMonitoringMode, MonitoringSession, RuleType } from '../../../../models/daas';
import { Options } from 'ng5-slider';
import { SiteDaasInfo } from '../../../../models/solution-metadata';
import { DaasService } from '../../../../services/daas.service';

@Component({
  selector: 'cpu-monitoring-rule',
  templateUrl: './cpu-monitoring-rule.component.html',
  styleUrls: ['./cpu-monitoring-rule.component.scss']
})
export class CpuMonitoringRuleComponent implements OnInit, OnChanges {

  @Input() ruleType: RuleType = RuleType.Diagnostics;
  @Input() activeSession: MonitoringSession;
  @Input() siteToBeDiagnosed: SiteDaasInfo;
  @Input() blobSasUri: string;

  @Output() monitoringConfigurationChange: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Output() monitoringEnabledChange: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Output() savingMonitoringConfiguration: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Output() editModeChange: EventEmitter<boolean> = new EventEmitter<boolean>();

  monitoringEnabled: boolean = false;
  RuleType = RuleType;
  editMode: boolean = false;
  savingSettings: boolean = false;
  monitoringSession: MonitoringSession;
  originalMonitoringSession: MonitoringSession;

  operationInProgress: boolean = false;
  mode: CpuMonitoringMode;
  ruleSummary: string = "";
  error: any;
  sessionModeTypes: string[] = ["Kill", "Collect", "CollectAndKill", "CollectKillAndAnalyze"];

  descStart: string = "If site's process (or child process) consume CPU greater than <b>CPU threshold</b> for more than <b>Threshold Seconds</b>";
  descMemoryDump: string = "a memory dump is collected";
  descKillMessage: string = "<b>Kill</b> is not graceful termination of the process.";

  modeDescriptions = [{ Mode: CpuMonitoringMode.Collect, Description: `${this.descStart}, ${this.descMemoryDump}.` },
  { Mode: CpuMonitoringMode.CollectAndKill, Description: `${this.descStart}, ${this.descMemoryDump} and the process consuming high CPU is killed. ${this.descKillMessage}` },
  { Mode: CpuMonitoringMode.CollectKillAndAnalyze, Description: `${this.descStart},  ${this.descMemoryDump} and the process consuming high CPU is killed. ${this.descKillMessage} Post collection, dumps are also analyzed and an analysis report is generated.` },
  { Mode: CpuMonitoringMode.Kill, Description: `${this.descStart}, the process is killed. ${this.descKillMessage}` }];

  modeDescription: string = "";


  sliderOptionsCpuThreshold: Options = {
    floor: 50, ceil: 95, step: 5, showTicks: true,
    translate: (value: number): string => {
      return value + "%";
    }
  };

  sliderOptionsMonitorDuration: Options = {
    floor: 15, ceil: 60, step: 15, showTicks: true,
    translate: (value: number): string => {
      return value + " sec";
    }
  };
  sliderOptionsThresholdSeconds: Options = {
    floor: 30, ceil: 180, step: 30, showTicks: true,
    translate: (value: number): string => {
      return value + " sec";
    }
  };

  sliderOptionsMaxActions: Options = {
    floor: 1, ceil: 5, showTicks: true
  };

  sliderOptionsMaxDuration: Options = {
    floor: 1, ceil: 2160, showTicks: true, step: 1, logScale: true,
    translate: (value: number): string => {
      let label = (value === 1) ? ' hour' : ' hours';
      let displayValue = value.toString();
      if (value > 48) {
        label = ' days';
        displayValue = this.getValueRounded(value / 24);
      }
      return displayValue + label;
    }
  };


  getValueRounded(value: number): string {
    let displayValue = value.toPrecision(2);
    displayValue = (displayValue.endsWith(".0")) ? displayValue.substring(0, displayValue.length - 2) : displayValue;
    return displayValue;
  }

  constructor(private _daasService: DaasService) {
  }

  ngOnInit() {
    if (this.activeSession == null) {
      this.monitoringSession = this.getDefaultMonitoringSettings();
    }
    else {
      this.monitoringSession = this.activeSession;
      this.mode = this.monitoringSession.Mode;
      this.originalMonitoringSession = this.activeSession;
      this.monitoringEnabled = true;
    }

    this.updateRuleSummary();
  }

  ngOnChanges() {
    if (this.activeSession != null) {
      this.monitoringSession = this.activeSession;
      this.originalMonitoringSession = this.activeSession;
      this.monitoringEnabled = true;
    } else {

      // So this is the case, when the parent component changes the 
      // state of the monitoring session
      this.monitoringEnabled = false;
      this.originalMonitoringSession = null;
      this.monitoringSession = this.getDefaultMonitoringSettings();
    }
  }

  getDefaultMonitoringSettings(): MonitoringSession {

    let monitoringSession = new MonitoringSession();
    monitoringSession.CpuThreshold = 75;
    monitoringSession.MonitorDuration = 15;
    monitoringSession.Mode = CpuMonitoringMode.CollectAndKill;
    monitoringSession.MaxActions = 2;
    monitoringSession.ThresholdSeconds = 30;
    monitoringSession.MaximumNumberOfHours = 24 * 14;
    this.mode = monitoringSession.Mode;
    this.modeDescription = this.modeDescriptions.find(x => x.Mode == this.mode).Description;
    this.selectMode(this.mode);
    return monitoringSession;
  }

  selectMode(md: string) {
    this.mode = CpuMonitoringMode[md];
    if (this.monitoringSession != null) {
      this.monitoringSession.Mode = this.mode;
      this.modeDescription = this.modeDescriptions.find(x => x.Mode == this.mode).Description;
      this.updateRuleSummary();
    }
  }

  updateRuleSummary() {
    let actionToTake = "";
    switch (this.monitoringSession.Mode) {
      case CpuMonitoringMode.Collect:
        actionToTake = "collect a memory dump";
        break;
      case CpuMonitoringMode.CollectAndKill:
        actionToTake = "collect a memory dump and kill the process";
        break;
      case CpuMonitoringMode.CollectKillAndAnalyze:
        actionToTake = "collect a memory dump and analyze when all the dumps have been collected";
        break;
      case CpuMonitoringMode.Kill:
        actionToTake = "kill the process";
        break;

    }
    this.ruleSummary = `When the site's process or any child processes of the site's process takes <b>${this.monitoringSession.CpuThreshold}%</b> of CPU for more than <b>${this.monitoringSession.ThresholdSeconds}</b> seconds, <b>${actionToTake}</b>. Evaluate CPU usage every <b>${this.monitoringSession.MonitorDuration} seconds</b>.`;
    if (this.monitoringSession.Mode != CpuMonitoringMode.Kill) {
      this.ruleSummary = this.ruleSummary + ` Collect a maximum of <b>${this.monitoringSession.MaxActions} memory dumps</b>.`;
    }

    this.ruleSummary += ` Monitoring will stop automatically after <b>${this.monitoringSession.MaximumNumberOfHours > 24 ? (this.getValueRounded(this.monitoringSession.MaximumNumberOfHours / 24)) + " days" : this.monitoringSession.MaximumNumberOfHours + " hours"}</b>.`;

    if (this.monitoringSession.MonitorScmProcesses) {
      this.ruleSummary += " The worker process for the kudu site and the webjobs under this app will also be monitored."
    }
  }

  saveCpuMonitoring() {
    this.updateSavingSettings(true);
    if (this.monitoringEnabled) {
      let newSession: MonitoringSession = new MonitoringSession();
      newSession.MaxActions = this.monitoringSession.MaxActions;
      newSession.Mode = this.monitoringSession.Mode;
      newSession.MonitorDuration = this.monitoringSession.MonitorDuration;
      newSession.ThresholdSeconds = this.monitoringSession.ThresholdSeconds;
      newSession.CpuThreshold = this.monitoringSession.CpuThreshold;
      newSession.MaximumNumberOfHours = this.monitoringSession.MaximumNumberOfHours;
      newSession.MonitorScmProcesses = this.monitoringSession.MonitorScmProcesses;
      newSession.BlobSasUri = this.blobSasUri;

      this._daasService.submitMonitoringSession(this.siteToBeDiagnosed, newSession).subscribe(
        result => {
          this.updateSavingSettings(false);
          this.updateEditMode(false);
          this.originalMonitoringSession = newSession;
          this.monitoringConfigurationChange.emit(true);
        }, error => {
          this.monitoringEnabled = !this.monitoringEnabled;
          this.updateSavingSettings(false);
          this.error = JSON.stringify(error);
          this.monitoringConfigurationChange.emit(true);
        });

    }
    else {
      this._daasService.stopMonitoringSession(this.siteToBeDiagnosed).subscribe(
        resp => {
          this.updateSavingSettings(false);
          this.updateEditMode(false);
          this.originalMonitoringSession = null;
          this.monitoringConfigurationChange.emit(this.monitoringEnabled);
        }, error => {
          this.updateSavingSettings(false);
          this.monitoringEnabled = !this.monitoringEnabled;
          this.error = JSON.stringify(error);
          this.monitoringConfigurationChange.emit(this.monitoringEnabled);
        });

    }
  }

  checkForChanges(monitoringEnabled: boolean = null) {
    if (monitoringEnabled != null) {
      this.monitoringEnabled = monitoringEnabled;
    }

    if ((this.originalMonitoringSession == null && this.monitoringEnabled) || (this.originalMonitoringSession != null && this.monitoringEnabled === false)) {
      this.updateEditMode(true);
    }
    else {
      this.updateEditMode(false);
    }
  }

  cancelChanges() {
    this.updateEditMode(false);
    if (this.originalMonitoringSession == null && this.monitoringEnabled) {
      this.monitoringEnabled = false;
    }
    this.checkForChanges();
  }

  getMonitoringSession(): MonitoringSession {
    return this.monitoringSession;
  }

  updateEditMode(editMode: boolean) {
    this.editMode = editMode;
    this.editModeChange.emit(editMode);
  }

  updateSavingSettings(saving: boolean) {
    this.savingSettings = saving;
    this.savingMonitoringConfiguration.emit(saving);
  }
}