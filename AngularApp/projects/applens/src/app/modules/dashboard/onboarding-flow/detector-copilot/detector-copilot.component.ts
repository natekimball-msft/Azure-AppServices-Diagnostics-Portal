import { Component, OnInit, OnChanges, Input, Output, EventEmitter, SimpleChanges, OnDestroy } from '@angular/core';
import { PanelType } from 'office-ui-fabric-react';
import { ChatMessage, ChatModel, ChatUIContextService, CreateChatCompletionModel, CreateTextCompletionModel, MessageSource, MessageStatus, ResponseTokensSize, StringUtilities, TextModels } from 'diagnostic-data';
import { DevelopMode } from '../onboarding-flow.component';
import { Observable } from 'rxjs';
import { concatMap } from 'rxjs/operators';
import { ApplensOpenAIChatService } from 'projects/applens/src/app/shared/services/applens-openai-chat.service';

@Component({
  selector: 'detector-copilot',
  templateUrl: './detector-copilot.component.html',
  styleUrls: ['./detector-copilot.component.scss']
})
export class DetectorCopilotComponent implements OnInit, OnChanges, OnDestroy {

  @Input() openPanel: boolean = false;
  @Input() detectorCode: string = '';
  @Input() detectorDevelopMode: DevelopMode;
  @Input() azureServiceType: string;
  @Input() detectorAuthor: string;
  @Output() onPanelClose = new EventEmitter();
  @Output() onCodeSuggestion = new EventEmitter<{ code: string, append: boolean, source: string }>();

  chatComponentIdentifier: string = "detectorcopilot";
  contentDisclaimerMessage: string = "I am a little biased towards writing code. If you dont want to generate code, just specify <b>'no code'</b> with your messages. *Also, no sensitive data please :)";
  chatHeader: string = '';
  chatModel: ChatModel = ChatModel.GPT4;
  responseTokenSize: ResponseTokensSize = ResponseTokensSize.Small;
  panelType: PanelType = PanelType.custom;
  panelWidth: string = "750px";
  previousMessage: any;
  stopMessageGeneration: boolean = false;
  messageInProgress: boolean = false;
  clearChatConfirmationHidden: boolean = true;
  codeHistory: string[] = [];
  codeHistoryNavigator: number = -1;

  private detectorTemplate: string;
  private codeUsedInPrompt: string;
  private maxLinesLimitForCodeUpdate: number = 100;

  private codeProgressMessages: string[] = [];
  private codeCompleteMessages: string[] = [];
  private codeProgressMsgIndex: number = 0;
  private codeCompleteMsgIndex: number = 0;

  constructor(private _chatContextService: ChatUIContextService, private openAIService: ApplensOpenAIChatService) {
  }

  ngOnInit(): void {
    this.prepareChatHeader();
    this.prepareCodeUpdateMessages();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.detectorDevelopMode == DevelopMode.Create && this.detectorTemplate == undefined) {
      this.detectorTemplate = this.detectorCode;
    }

    if (this.codeHistory.length == 0 && this.detectorCode && this.detectorCode != '') {
      this.codeHistory.push(this.detectorCode);
      this.codeHistoryNavigator = 0;
      console.log(this.detectorAuthor);
      console.log(this.azureServiceType);
    }
  }

  ngOnDestroy(): void {
    this.dismissedHandler();
  }

  dismissedHandler(): void {
    this.openPanel = false;
    this.onPanelClose.emit();
  }

  //#region Chat Callback Methods

  onUserMessageSend = (messageObj: ChatMessage): ChatMessage => {

    if (this.responseTokenSize != ResponseTokensSize.Medium) {
      this.responseTokenSize = ResponseTokensSize.Medium;
    }

    messageObj.message = this.formatUserMessage(messageObj);
    this.messageInProgress = true;
    return messageObj;
  }

  onSystemMessageReceived = (messageObj: ChatMessage): ChatMessage => {

    var deltaMessage = '';
    var append: boolean;

    if (this.responseTokenSize != ResponseTokensSize.Medium) {
      this.responseTokenSize = ResponseTokensSize.Medium;
    }

    if (this.previousMessage == undefined) {
      deltaMessage = messageObj.message;
      append = false;
    }
    else {
      deltaMessage = StringUtilities.ReplaceAll(messageObj.message, this.previousMessage.message, '');
      append = true;
    }

    // messageObj.message will always contain concatenated message so far. So for partial code, it will contain code tags
    let isMessageContainsCode: boolean = this.isMessageContainsCode(messageObj.message);

    if (isMessageContainsCode && deltaMessage != '') {

      // indicate the monaco-editor to start updating the code
      this.onCodeSuggestion.emit({
        code: this.extractCode(deltaMessage),
        append: append,
        source: 'openai'
      });
    }


    var displayMsg = messageObj.message;

    switch (messageObj.status) {

      case MessageStatus.InProgress: {

        if (isMessageContainsCode) {
          if (messageObj.displayMessage == undefined || messageObj.displayMessage == '') {
            // assign a new code update message
            displayMsg = `${this.codeProgressMessages[this.codeProgressMsgIndex]}\n...`;
            this.codeProgressMsgIndex = (this.codeProgressMsgIndex + 1) % this.codeProgressMessages.length;
          } else {
            // retain the previous code update message
            displayMsg = messageObj.displayMessage;
          }
        }

        this.messageInProgress = true;
        this.previousMessage = {
          id: messageObj.id,
          status: messageObj.status,
          message: messageObj.message,
          displayMessage: displayMsg
        };

        break;
      }
      case MessageStatus.Finished: {

        if (isMessageContainsCode) {

          if (messageObj.displayMessage != undefined && messageObj.displayMessage != '') {
            //append code complete message to existing message string.
            displayMsg = `${messageObj.displayMessage}\n...\n${this.codeCompleteMessages[this.codeCompleteMsgIndex]}`;
          }
          else {
            // message was completed in one go. There is no previous message string. Assign a code complete message.
            displayMsg = `${this.codeCompleteMessages[this.codeCompleteMsgIndex]}`;
          }

          this.codeCompleteMsgIndex = (this.codeCompleteMsgIndex + 1) % this.codeCompleteMessages.length;
          this.updateCodeHistory(messageObj);
        }

        this.messageInProgress = false;
        this.previousMessage = undefined;
        this.responseTokenSize = ResponseTokensSize.Small;

        break;
      }
      case MessageStatus.Cancelled: {

        if (isMessageContainsCode) {

          this.updateCodeHistory(messageObj);
        }

        // open-ai component is already either assigning or appending  cancellation message to the existing message string. 
        displayMsg = messageObj.displayMessage;
        this.messageInProgress = false;
        this.previousMessage = undefined;
        this.responseTokenSize = ResponseTokensSize.Small;

        break;
      }
    }

    messageObj.displayMessage = displayMsg;
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

  //#endregion

  //#region Settings : Clear Chat Methods

  clearChat = () => {
    this._chatContextService.clearChat(this.chatComponentIdentifier);
    this.clearChatConfirmationHidden = true;
  }

  showClearChatDialog = (show: boolean = true) => {
    this.clearChatConfirmationHidden = !show;
  }
  //#endregion

  //#region Settings : Previous and Next Code Options

  navigateCodeHistory = (moveLeft: boolean): void => {

    if ((moveLeft && this.codeHistoryNavigator <= 0) || (!moveLeft && this.codeHistoryNavigator >= this.codeHistory.length - 1))
      return;

    moveLeft ? this.codeHistoryNavigator-- : this.codeHistoryNavigator++;

    this.onCodeSuggestion.emit({
      code: this.codeHistory[this.codeHistoryNavigator],
      append: false,
      source: 'historynavigator'
    });
  }

  //#endregion

  //#region Settings : Stop Option

  cancelOpenAICall = () => {

    this.stopMessageGeneration = true;
    this.messageInProgress = false;

    setTimeout(() => {
      this.stopMessageGeneration = false;
    }, 1000);
  }

  //#endregion

  //#region Helper Methods

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

    this.codeUsedInPrompt = this.detectorCode && this.detectorCode != '' && this.detectorCode != this.detectorTemplate ? this.detectorCode : '';

    let message = this.codeUsedInPrompt != '' ?
      `Here is the initial detector code : \n <code>\n${this.detectorCode}\n</code>\n` : '';

    message = `${message}Action assistant need to take : ${chatMessageObj.message}\n`;

    if (this.codeUsedInPrompt == '') {
      // The user is writing code for first time. Pass in the service name and author
      message = `${message}This Azure service name is ${this.azureServiceType} and author is ${this.detectorAuthor}\n`;
    }


    let linesCountInCode = this.codeUsedInPrompt != '' ? this.detectorCode.split("\n").length : 0;
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

  private updateCodeHistory = (messageObj: ChatMessage) => {

    if (this.isMessageContainsCode(messageObj.message) && (messageObj.status == MessageStatus.Finished || messageObj.status == MessageStatus.Cancelled)) {
      let codeToAdd = this.extractCode(messageObj.message);
      if (this.codeHistory.length == 0 || codeToAdd != this.codeHistory[this.codeHistory.length - 1]) {
        this.codeHistory.push(codeToAdd);
        this.codeHistoryNavigator = this.codeHistory.length - 1;
      }
    }
  }

  private prepareChatHeader = () => {
    this.chatHeader = `
    <h1 class='copilot-header chatui-header-text'>
      <i data-icon-name="robot" aria-hidden="true" class="ms-Icon root-89 css-229 ms-Button-icon"></i>
      Detector Copilot (Preview)
      <img class='copilot-header-img' src='/assets/img/rocket.png' alt=''>
      <img class = 'copilot-header-img' src='/assets/img/rocket.png' alt=''">
    </h1>`;
  }

  private prepareCodeUpdateMessages = () => {

    this.codeCompleteMessages = [
      "The code update is complete! We're all clear for takeoff! ✈️🚀",
      "Code update is finished! Time to sit back, relax and let the awesomeness wash over you! 🏖️🌊",
      "Good news! The code update is finished and we're good to go! 🎉🎊",
      "The code update is done and dusted! Get ready for some serious awesomeness! 💥🤩",
      "Stop everything! The code update is complete and it's looking amazing! 🛑😍",
      "It's official! The code update is finished and ready to rock and roll! 🤘🎸",
      "Brace yourselves, the code update is done and it's a thing of beauty! 💎🤯",
      "Code update complete! Let's celebrate with some virtual high-fives all around! 🙌🎉",
      "The code update is good to go! Let's make some magic happen! ✨🎩",
      "Good news! The code update is complete and ready to blow your minds! 🤯💥",
      "The code update is finished and ready to rumble! Let's make some magic happen! 🎉🎊✨",
      "Hold on to your hats! The code update is complete and it's mind-blowing! 🧢💥🤯",
      "It's official! The code update is complete and it's better than sliced bread! 🍞👌🤩",
      "The code update is done and it's hotter than a summer day! ☀️🔥😎",
      "Code update complete! Get ready for some serious high-fives and fist bumps! 🙌👊"
    ];

    this.codeProgressMessages = [
      "Its time to update the code! 🚀 Brace yourselves for the awesomeness...",
      "Hold on tight! 🤠 Code update is in progress and it's gonna be epic...",
      "Buckle up, folks! 🎢 The code is getting a major upgrade and it's gonna be a wild ride...",
      "Attention! 📢 The code is being updated and it's gonna blow your mind...",
      "Get ready for the next level! 🎮 The code is updating and it's gonna be game-changing...",
      "It's time to level up! 🔝 The code is updating and it's gonna take things to the next level...",
      "Code update in progress... 💻 Brace yourselves for the awesomeness that's coming your way...",
      "Ready or not, here it comes! 🤪 The code is updating and it's gonna be a wild ride...",
      "Hold on to your hats! 🎩 The code is getting a major upgrade and it's gonna be mind-blowing...",
      "Here we go! 🏎️ The code is updating and it's gonna be a fast and furious ride...",
      "The code is getting smarter ... 👨‍💻 , but not as smart as you 😎",
      "The code is under construction!🚧 Brace yourselves, there is a storm coming 🤪 ...",
      "It's party time!🎉 The code is getting an update and it's gonna be a celebration...",
      "The code is heating up! 🔥 Brace yourselves for the fire that's about to be unleashed 🤪...",
      " The code is shining bright!🌟 Get ready to be dazzled by the awesomeness..."
    ];

    this.codeProgressMessages = StringUtilities.shuffleArray<string>(this.codeProgressMessages);
    this.codeCompleteMessages = StringUtilities.shuffleArray<string>(this.codeCompleteMessages);
  }

  //#endregion
}
