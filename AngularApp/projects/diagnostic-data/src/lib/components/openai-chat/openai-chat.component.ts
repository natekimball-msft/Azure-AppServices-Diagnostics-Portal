import { Component, Inject, Input, OnInit, Output, EventEmitter, OnDestroy } from '@angular/core';
import { DIAGNOSTIC_DATA_CONFIG, DiagnosticDataConfig } from '../../config/diagnostic-data-config';
import { TelemetryService } from '../../services/telemetry/telemetry.service';
import { map, catchError, delay, retryWhen, take } from 'rxjs/operators';
import { TelemetryEventNames } from '../../services/telemetry/telemetry.common';
import { DataRenderBaseComponent } from '../data-render-base/data-render-base.component';
import { ActivatedRoute, Router, Params } from '@angular/router';
import { of, Observable, forkJoin } from 'rxjs';
import { ISubscription } from "rxjs/Subscription";
import { GenericResourceService } from '../../services/generic-resource-service';
import { ChatMessage, MessageStatus, MessageSource, MessageRenderingType} from "../../models/chatbot-models";
import { TextModels, OpenAIAPIResponse, CreateTextCompletionModel } from '../../models/openai-data-models';
import { v4 as uuid } from 'uuid';
import { GenericOpenAIService } from '../../services/generic-openai.service';
import {FormControl} from "@angular/forms";

@Component({
    selector: 'openai-chat',
    templateUrl: './openai-chat.component.html',
    styleUrls: ['./openai-chat.component.scss']
})

export class OpenAIChatComponent implements OnInit {

    someFormControl: FormControl = new FormControl();
  /**ChatGPT section */
  fetchOpenAIResult(searchQuery: string, messageObj: ChatMessage, retry: boolean = true) {
    this.chatInputBoxDisabled = true;
    try {
      let openAIQueryModel = CreateTextCompletionModel(searchQuery);
      messageObj.status = MessageStatus.Waiting;
      this._openAIService.generateTextCompletion(openAIQueryModel, true).subscribe((res: OpenAIAPIResponse) => {
          var result = res?.choices[0].text;
          messageObj.message = messageObj.message + result;
          messageObj.displayedMessage = messageObj.message.replace(/\n/g, "<br />");
          //Check finishing criteria
          if (res.usage.completion_tokens == openAIQueryModel.max_tokens) {
            messageObj.status = MessageStatus.InProgress;
            this.fetchOpenAIResult(this.prepareChatContext(), messageObj);
          }
          else {
            messageObj.status = MessageStatus.Finished;
            messageObj.timestamp = new Date().getTime();
            this.chatgptSearchText = "";
            this.chatInputBoxDisabled = false;
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
    this.fetchOpenAIResult(this.prepareChatContext(), chatMessage);
  }
  /** */
    
    constructor(@Inject(DIAGNOSTIC_DATA_CONFIG) config: DiagnosticDataConfig, public telemetryService: TelemetryService,
        private _activatedRoute: ActivatedRoute, private _router: Router,
        private _resourceService: GenericResourceService,
        private _openAIService: GenericOpenAIService ) {
        super(telemetryService);
    }
    
    ngOnInit() {
    }

}  
