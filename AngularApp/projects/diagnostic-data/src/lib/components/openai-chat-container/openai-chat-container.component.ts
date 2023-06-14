import { Component, OnInit, ViewChild, Input, OnChanges, SimpleChanges } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  // Models 
  ChatMessage, ChatResponse, MessageStatus, MessageSource, MessageRenderingType, CreateTextCompletionModel,
  // Services
  ChatUIContextService, GenericOpenAIChatService,
  // Telemetry
  TelemetryService,
  // Components
  ChatUIComponent,
  // Utilities
  TimeUtilities,
  ChatAlignment,
  StringUtilities,
  ChatModel,
  CreateChatCompletionModel,
  ResponseTokensSize,
  TextModels,
  APIProtocol

} from "../../../public_api";
import { v4 as uuid } from 'uuid';
import { HttpClient } from '@angular/common/http';
import { KeyValuePair } from '../../models/common-models';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { PortalUtils } from 'projects/applens/src/app/shared/utilities/portal-util';

@Component({
  selector: 'openai-chat-container',
  templateUrl: './openai-chat-container.component.html',
  styleUrls: ['./openai-chat-container.component.scss']
})

export class OpenAIChatContainerComponent implements OnInit {
  @Input() customInitialPrompt: string = '';
  @Input() customFirstMessage: string = '';
  @Input() chatIdentifier: string = '';
  @Input() persistChat: boolean = false;
  @Input() chatHeader: string = '';
  @Input() chatContextLength: number = 2;
  @Input() chatQuerySamplesFileUri: string = ''; //e.g. "assets/chatConfigs/chatQuerySamples.json"
  @Input() fetchChat: Function;
  @Input() saveChat: Function;
  @Input() chatAlignment: ChatAlignment = ChatAlignment.Center;
  @Input() chatModel: ChatModel = ChatModel.GPT3;
  @Input() responseTokenSize: ResponseTokensSize = ResponseTokensSize.Small;
  @Input() stopMessageGeneration: boolean = false;
  @Input() systemInitial: string = "AI";
  @Input() systemPhotoSource: string = '/assets/img/openailogo.svg';
  @Input() showCopyOption:boolean = false;
  @Input() apiProtocol: APIProtocol = APIProtocol.Rest;

  // Callback methods for pre and post processing messages
  @Input() onUserMessageSend: (message: ChatMessage) => ChatMessage = function (message: ChatMessage) {
    return message;
  };
  @Input() onSystemMessageReceived: (message: ChatMessage) => ChatMessage;
  @Input() onPrepareChatContext: (context: any) => any = function (context: any) {
    return context;
  };

  // Variables that can be taken as input
  @Input() showFeedbackOptions: boolean = true;
  @Input() showContentDisclaimer: boolean = true;
  @Input() contentDisclaimerMessage: string = "";

  @Input() quotaEnforced: boolean = false;
  @Input() dailyMessageQuota: number = 20;
  @Input() messageQuotaWarningThreshold: number = 10;

  constructor(private _activatedRoute: ActivatedRoute, private _router: Router,
    private _chatContextService: ChatUIContextService,
    private _openAIService: GenericOpenAIChatService,
    private _telemetryService: TelemetryService,
    private http: HttpClient) {
  }

  // Variables to be passed down to the chat UI component
  openAIChatRequestError: string = '';
  showChatRequestError: boolean = false;
  showMessageQuotaError: boolean = false;
  messageQuotaErrorMessage: string = '';
  showMessageQuotaWarning: boolean = false;
  messageQuotaWarningMessage: string = '';

  // Component's internal variables
  isEnabled: boolean = false;
  isEnabledChecked: boolean = false;
  openaiChatSearchText: string = "";
  chatQuerySamples: KeyValuePair[] = [];
  public chatInProgress:boolean = false;
  private lastMessageIdForFeedback: string = '';
  clearChatConfirmationHidden: boolean = true;

  // This is the limit on the number of recursive calls made to open AI
  openAIApiCallLimit = 10;
  currentApiCallCount = 0;

  private openAIAPICallSubscription: Subscription; 

  updateStatusAndPreProcessUserMessage = (message: ChatMessage): ChatMessage => {
    this.chatInProgress = true;
    this.lastMessageIdForFeedback = message.id;

    if(this.onUserMessageSend) {
      return this.onUserMessageSend(message);
    }
    else {
      return message;
    }
    
  }

  updateStatusAndPostProcessSystemMessage = (message: ChatMessage): ChatMessage => {
    if(message.status === MessageStatus.Finished || message.status === MessageStatus.Cancelled) {
      this.chatInProgress = false;
    }

    if(this.onSystemMessageReceived) {
      return this.onSystemMessageReceived(message);
    }
    else {
      message.displayMessage = message.message;
      return message;
    }
  }
  

  cancelOpenAICall = () => {
    this.stopMessageGeneration = true;
    setTimeout(() => {
      this.stopMessageGeneration = false;
    }, 1000);
  }

  sendFeedback = () => {
    let newline = '%0D%0A';
    const subject = encodeURIComponent(`${this.chatHeader} Feedback`);
    let body = encodeURIComponent('Please provide feedback here:');
    let link = "";

    var browserType = PortalUtils.getBrowserType();
    var url = window.location.href;
    let debugInfo = `${newline}============ Debug Info ============${newline}`;
    debugInfo += `Browser: ${browserType}${newline}`;
    debugInfo += `Last User Message Id: ${this.lastMessageIdForFeedback}${newline}`;
    debugInfo += `Url: ${url}${newline}`;


    body = `${body}${newline}${newline}${newline}${debugInfo}`;
    link = `mailto:applensv2team@microsoft.com?subject=${subject}&body=${body}`;
    window.open(link);
  }


  clearChat = () => {
    this._chatContextService.clearChat(this.chatIdentifier);
    this.clearChatConfirmationHidden = true;
  }

  showClearChatDialog = (show: boolean = true) => {
    this.clearChatConfirmationHidden = !show;
  }

  ngOnInit() {
    this._openAIService.CheckEnabled().subscribe(enabled => {
      this.isEnabled = this._openAIService.isEnabled;
    });
  }
}  
