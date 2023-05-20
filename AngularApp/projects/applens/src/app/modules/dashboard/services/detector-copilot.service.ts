import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { PanelType } from 'office-ui-fabric-react';
import { DevelopMode } from '../onboarding-flow/onboarding-flow.component';

@Injectable({
  providedIn: 'root'
})
export class DetectorCopilotService {

  public openPanel: boolean;
  public panelType: PanelType = PanelType.custom;
  public panelWidth: string = "750px";
  public detectorCode: string;
  public detectorTemplate: string;
  public detectorDevelopMode: DevelopMode;
  public azureServiceType: string;
  public detectorAuthor: string;
  public onCodeSuggestion: BehaviorSubject<{ code: string, append: boolean, source: string }>;

  constructor() {
    this.onCodeSuggestion = new BehaviorSubject<{ code: string, append: boolean, source: string }>(null);
  }

  hideCopilotPanel() {
    this.openPanel = false;
  }

  showCopilotPanel() {
    this.openPanel = true;
  }
}