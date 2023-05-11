import { Component, OnInit, OnChanges, Input, Output, EventEmitter, SimpleChanges, OnDestroy } from '@angular/core';
import { PanelType } from 'office-ui-fabric-react';
import { ChatMessage, ChatModel, ChatUIContextService, MessageSource, MessageStatus, StringUtilities } from '../../../../../../../diagnostic-data/src/public_api';
import { last } from 'rxjs-compat/operator/last';
import { DevelopMode } from '../onboarding-flow.component';

@Component({
  selector: 'detector-copilot',
  templateUrl: './detector-copilot.component.html',
  styleUrls: ['./detector-copilot.component.scss']
})
export class DetectorCopilotComponent implements OnInit, OnChanges, OnDestroy {

  @Input() openPanel: boolean = false;
  @Input() detectorCode: string = '';
  @Input() detectorDevelopMode: DevelopMode;

  @Output() onPanelClose = new EventEmitter();
  @Output() onCodeSuggestion = new EventEmitter<{ code: string, append: boolean }>();

  copilotPrompt: string = '';
  userAlias: string = "shgup";
  chatComponentIdentifier: string = "detectorcopilot";
  contentDisclaimerMessage: string = "I am a little biased towards writing code. If you dont want to generate code, just specify <b>'no code'</b> with your messages. *Also, no sensitive data please :)";
  chatHeader: string = `<h1 class='chatui-header-text'>Detector CoPilot</h1>`;
  chatModel: ChatModel = ChatModel.GPT4;

  panelType: PanelType = PanelType.custom;
  panelWidth: string = "750px";
  previousMessage: any;

  private detectorTemplate: string;
  private codeUsedInPrompt: string;
  private maxLinesLimitForCodeUpdate: number = 100;

  constructor(private _chatContextService: ChatUIContextService) {
  }

  ngOnInit(): void {
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.detectorDevelopMode == DevelopMode.Create && this.detectorTemplate == undefined) {
      this.detectorTemplate = this.detectorCode;
    }
  }

  ngOnDestroy(): void {
    this.dismissedHandler();
  }

  onUserMessageSend = (messageObj: ChatMessage): ChatMessage => {

    messageObj.message = this.formatUserMessage(messageObj);
    return messageObj;
  }

  onSystemMessageReceived = (messageObj: ChatMessage): ChatMessage => {

    var deltaMessage = '';
    var append: boolean;
    if (this.previousMessage == undefined) {
      deltaMessage = messageObj.message;
      append = false;
    }
    else {
      deltaMessage = StringUtilities.ReplaceAll(messageObj.message, this.previousMessage.message, '');
      append = true;
    }

    if (this.isMessageContainsCode(messageObj.message)) {
      messageObj.displayMessage = messageObj.status == MessageStatus.InProgress ? "Code update in progress! Brace yourselves for awesomeness ..." : "Code updated and good to go!";
      this.onCodeSuggestion.emit({
        code: this.extractCode(deltaMessage),
        append: append
      });
    }
    else {
      messageObj.displayMessage = messageObj.message;
    }

    this.previousMessage = messageObj.status == MessageStatus.Finished ? undefined :
      {
        id: messageObj.id,
        status: messageObj.status,
        message: messageObj.message,
        displayMessage: messageObj.displayMessage
      };

    return messageObj;
  }


  onPrepareChatContext = (chatContext: any): any => {

    let lastMessage: ChatMessage = this._chatContextService.messageStore[this.chatComponentIdentifier].at(-1);
    if (lastMessage.messageSource == MessageSource.System && lastMessage.status == MessageStatus.InProgress) {
      let lastLine = lastMessage.message.split('\n').slice(-1);
      let linesOfCode = this.codeUsedInPrompt && this.codeUsedInPrompt != '' ? this.codeUsedInPrompt.split("\n").length : 0;
      if (linesOfCode <= this.maxLinesLimitForCodeUpdate) {
        chatContext.push({
          "role": "User",
          "content": `Finish the above message. Make sure you start the new message with characters right after where the above message ended at '${lastLine}'. Only tell me the remaining message and not the enitre message again. No code explanation needed.`
        });
      }
    }

    return chatContext;
  }

  dismissedHandler(): void {
    this.openPanel = false;
    this.onPanelClose.emit();
  }

  private isMessageContainsCode(message: string): boolean {
    return message && message != '' && (message.toLowerCase().indexOf('<code>') >= 0);
  }

  private extractCode(message: string): string {
    let stringsToRemove = ['<code>', '</code>', '<CODE>', '</CODE>'];
    let outputMessage = message;
    stringsToRemove.forEach(p => {
      outputMessage = StringUtilities.ReplaceAll(outputMessage, p, '');
    });

    return StringUtilities.TrimBoth(outputMessage);
  }

  private formatUserMessage(chatMessageObj: ChatMessage): string {

    this.codeUsedInPrompt = this.detectorCode;
    let message = this.detectorCode && this.detectorCode != '' && this.detectorCode != this.detectorTemplate ?
      `Here is the initial detector code : \n <code>\n${this.detectorCode}\n</code>\n` : '';
    message = `${message}Action assistant need to take : ${chatMessageObj.message}\n`;


    let linesCountInCode = this.detectorCode && this.detectorCode != '' ? this.detectorCode.split("\n").length : 0;
    let rules = `1. If you are responding with code, No need to write any explanation before or after the code. Just respond with the updated code.
    2. Enclose the code in <code> tags`;

    if (linesCountInCode > this.maxLinesLimitForCodeUpdate) {
      rules = `1. If you are responding with code, Dont respond with the entire code. Only give the code that needs to be added, deleted or updated.
      2. Also give the correct line numbers information.
      3. The output should be rendered in markdown`;
    }

    message = `${message}Rules assistant have to follow :\n ${rules}`;
    return message;
  }
}
