import { Component, OnInit, OnChanges, Input, Output, EventEmitter, SimpleChanges } from '@angular/core';
import { PanelType } from 'office-ui-fabric-react';
import { ChatMessage } from '../../../../../../../diagnostic-data/src/public_api';

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

  userAlias: string = "shgup";
  chatComponentIdentifier: string = "DetectorCopilot";
  contentDisclaimerMessage: string = "* Please do not send any sensitive data in your queries.";
  chatHeader: string = `<h1 class='chatui-header-text'>Detector CoPilot</h1>`;

  panelType: PanelType = PanelType.large;
  panelWidth: string = "1000px";

  ngOnInit(): void {
  }

  ngOnChanges(changes: SimpleChanges): void {
  }

  onUserMessageSend(messageObj: ChatMessage): ChatMessage {
    return messageObj;
  }

  onSystemMessageReceived = (messageObj: ChatMessage): ChatMessage => {

    let codeFromMessage = this.extractClassCode(messageObj.message);
    if(codeFromMessage === '')
    {
      messageObj.displayMessage = `${messageObj.message}`;  
    }
    else
    {
      this.onCodeSuggestion.emit(codeFromMessage);
      messageObj.displayMessage =  `${messageObj.message}`;  //'I have updated your code in the editor.';
    }

    return messageObj;
  }

  dismissedHandler(): void {
    this.openPanel = false;
    this.onPanelClose.emit();
  }

  private extractClassCode(message: string): string {

    if (message == undefined || message == '' || message.indexOf('public class ') < 0) {
      return '';
    }

    var code = message.substring(message.indexOf('{') + 1);
    code = code.substring(0, code.lastIndexOf('}') - 1);
    var codeParts = code.split('\n');
    var codePartsFormatted = codeParts.map((str) => str.replace("    ", ""));
    return codePartsFormatted.join('\n');
  }
}
