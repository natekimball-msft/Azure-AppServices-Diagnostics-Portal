import { Component, Inject, Input, OnInit, Output, EventEmitter, OnDestroy } from '@angular/core';
import { map, catchError, delay, retryWhen, take } from 'rxjs/operators';
import { ActivatedRoute, Router, Params } from '@angular/router';
import { of, Observable, forkJoin } from 'rxjs';
import { ISubscription } from "rxjs/Subscription";
import { ChatMessage, MessageStatus, MessageSource, MessageRenderingType} from "diagnostic-data";
import { TextModels, OpenAIAPIResponse, CreateTextCompletionModel } from 'diagnostic-data';
import { v4 as uuid } from 'uuid';
import { ApplensOpenAIService } from '../../../shared/services/applens-openai.service';
import {FormControl} from "@angular/forms";
import { DiagnosticApiService } from '../../../shared/services/diagnostic-api.service';
import { AdalService } from 'adal-angular4';

@Component({
    selector: 'openai-chat',
    templateUrl: './openai-chat.component.html',
    styleUrls: ['./openai-chat.component.scss']
})

export class OpenAIChatComponent implements OnInit {

    someFormControl: FormControl = new FormControl();

  scrollToBottom() {
    var allChatMessages = document.getElementsByClassName("chatgpt-message-box");
    if (allChatMessages.length > 0) {
      allChatMessages[allChatMessages.length - 1].scrollIntoView();
    }
  }

  specialTrim(str: string) {
    if (str && str.startsWith("\n")) {
      return str.replace(/^\s+|\s+$/g, '');
    }
    return str;
  }

  /**ChatGPT section */
  fetchOpenAIResult(searchQuery: string, messageObj: ChatMessage, retry: boolean = true, trimnewline: boolean = true) {
    this.chatInputBoxDisabled = true;
    try {
      let openAIQueryModel = CreateTextCompletionModel(searchQuery);
      messageObj.status = messageObj.status == MessageStatus.Created ? MessageStatus.Waiting: messageObj.status;
      this._openAIService.generateTextCompletion(openAIQueryModel, true).subscribe((res: OpenAIAPIResponse) => {
          var result = res?.choices[0].text;
          //Trim any newline character at the beginning of the result
          messageObj.message = messageObj.message + (trimnewline? result.trim(): result.trimEnd());
          messageObj.displayedMessage = messageObj.message.replace(/\n/g, "<br>");
          //Check finishing criteria
          if (res.usage.completion_tokens == openAIQueryModel.max_tokens) {
            //Will need some additional criteria here to check if the response is complete
            messageObj.status = MessageStatus.InProgress;
            
            //Do not trim newline for the next query
            this.fetchOpenAIResult(this.prepareChatContext(), messageObj, retry, trimnewline=false);
            this.scrollToBottom();
          }
          else {
            messageObj.status = MessageStatus.Finished;
            messageObj.timestamp = new Date().getTime();
            this.chatgptSearchText = "";
            this.chatInputBoxDisabled = false;
            this.scrollToBottom();
            document.getElementById(`chatGPTInputBox`).focus();
          }
      },
      (err) => {
          if (retry) {
              this.fetchOpenAIResult(searchQuery, messageObj, retry=false);
          }
          this.handleFailure(messageObj);
      });
    }
    catch (error) {
      this.handleFailure(messageObj);
    }
  }

  handleFailure(messageObj) {
    messageObj.message = (messageObj.message && messageObj.message.length>0? messageObj.message + "\n": messageObj.message) + "An error occurred. Please try again.";
    messageObj.displayedMessage = messageObj.message.replace(/\n/g, "<br />");
    messageObj.status = MessageStatus.Finished;
    messageObj.timestamp = new Date().getTime();
    this.chatgptSearchText = "";
    this.chatInputBoxDisabled = false;
    this.scrollToBottom();
    document.getElementById("chatGPTInputBox").focus();
  }

  chatgptSearchText: string = "";
  messages: ChatMessage[] = [];
  chatInputBoxDisabled: boolean = false;
  chatQuerySamples: string[] = [
    "How to configure autoscale for Azure App Service?",
    "Explain this error: Bad Config Metadata",
    "Summarize this exception message: Microsoft.Azure.Storage....",
    "How to configure Virtual Network on Azure Kubernetes cluster?",
    "What are the Azure App Service resiliency features?",
    "How to integrate KeyVault in Azure Function App?"
  ];

  prepareChatContext(){
    return this.messages.slice(-6).map(x => `${x.messageSource}: ${x.message}`).join('\n');
  }

  onchatSampleClick(idx: number){
    this.chatgptSearchText = this.chatQuerySamples[idx];
    this.triggerChat();
  }

  triggerChat(){
    this.messages.push({
      id: uuid(),
      message: this.chatgptSearchText,
      displayedMessage: this.chatgptSearchText,
      messageSource: MessageSource.User,
      timestamp: new Date().getTime(),
      status: MessageStatus.Finished,
      renderingType: MessageRenderingType.Text
    });
    this.chatInputBoxDisabled = true;
    let chatMessage = {
      id: uuid(),
      message: "",
      displayedMessage: "",
      messageSource: MessageSource.System,
      timestamp: new Date().getTime(),
      status: MessageStatus.Created,
      renderingType: MessageRenderingType.Text
    };
    this.messages.push(chatMessage);
    this.scrollToBottom();
    this.fetchOpenAIResult(this.prepareChatContext(), chatMessage);
  }
  /** */
    
    constructor(private _activatedRoute: ActivatedRoute, private _router: Router,
        private _openAIService: ApplensOpenAIService, private _diagnosticApiService: DiagnosticApiService, private _adalService: AdalService ) {
    }

    userPhotoSource: any = "";
    userNameInitial: string = "";
    
    ngOnInit() {
      const alias = this._adalService.userInfo.profile ? this._adalService.userInfo.profile.upn : '';
      const userId = alias.replace('@microsoft.com', '');
      this._diagnosticApiService.getUserPhoto(userId).subscribe(image => {
        this.userPhotoSource = image;
      });

      if (this._adalService.userInfo.profile) {
        const familyName: string = this._adalService.userInfo.profile.family_name;
        const givenName: string = this._adalService.userInfo.profile.given_name;
        this.userNameInitial = `${givenName.charAt(0).toLocaleUpperCase()}${familyName.charAt(0).toLocaleUpperCase()}`;
      }
    }

}  
