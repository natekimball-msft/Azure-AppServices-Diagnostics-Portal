import { Component, Inject, Input, OnInit, Output, EventEmitter, OnDestroy } from '@angular/core';
import { map, catchError, delay, retryWhen, take } from 'rxjs/operators';
import { ActivatedRoute, Router, Params } from '@angular/router';
import { of, Observable, forkJoin } from 'rxjs';
import { ISubscription } from "rxjs/Subscription";
import { ChatMessage, MessageStatus, MessageSource, MessageRenderingType} from "diagnostic-data";
import { TextModels, OpenAIAPIResponse, CreateTextCompletionModel } from 'diagnostic-data';
import { v4 as uuid } from 'uuid';
import { ApplensOpenAIService } from '../../../shared/services/applens-openai.service';
import { DiagnosticApiService } from '../../../shared/services/diagnostic-api.service';
import { AdalService } from 'adal-angular4';
import {ChatGPTContextService} from "diagnostic-data";
import { UserSettingService } from '../services/user-setting.service';
import { ResourceProviderMessages, UserChatGPTSetting } from '../../../shared/models/user-setting';
import { ResourceService } from '../../../shared/services/resource.service';

@Component({
    selector: 'openai-chat',
    templateUrl: './openai-chat.component.html',
    styleUrls: ['./openai-chat.component.scss']
})

export class OpenAIChatComponent implements OnInit {

  constructor(private _activatedRoute: ActivatedRoute, private _router: Router,
    private _openAIService: ApplensOpenAIService,
    private _diagnosticApiService: DiagnosticApiService,
    private _adalService: AdalService,
    public _chatContextService: ChatGPTContextService,
    private _userSettingService: UserSettingService,
    private _resourceService: ResourceService) {
  }

  userChatGPTSetting: UserChatGPTSetting;
  showMessageQuotaError: boolean = false;
  showMessageQuotaWarning: boolean = false;
  showDataDisclaimer: boolean = true;
  dailyMessageQuota: number = 10;
  messageQuotaWarningThreshold: number = 3;
  isEnabled: boolean = false;
  currentResourceProvider: string;
    
  ngOnInit() {
    this.currentResourceProvider = `${this._resourceService.ArmResource.provider}/${this._resourceService.ArmResource.resourceTypeName}`.toLowerCase();
    this._openAIService.CheckEnabled().subscribe(enabled => {
      this.isEnabled = this._openAIService.isEnabled;
    });
    this.isEnabled = this._openAIService.isEnabled;    
    const alias = this._adalService.userInfo.profile ? this._adalService.userInfo.profile.upn : '';
    const userId = alias.replace('@microsoft.com', '');
    this._diagnosticApiService.getUserPhoto(userId).subscribe(image => {
      this._chatContextService.userPhotoSource = image;
    });

    if (this._adalService.userInfo.profile) {
      const familyName: string = this._adalService.userInfo.profile.family_name;
      const givenName: string = this._adalService.userInfo.profile.given_name;
      this._chatContextService.userNameInitial = `${givenName.charAt(0).toLocaleUpperCase()}${familyName.charAt(0).toLocaleUpperCase()}`;
    }

    this._userSettingService.getUserSetting(false).subscribe((settings) => {
      this.userChatGPTSetting = settings.userChatGPTSetting && settings.userChatGPTSetting.length>0? JSON.parse(settings.userChatGPTSetting): {
        allMessages: [],
        messageDailyCount: 0
      };
      if (this.userChatGPTSetting && this.userChatGPTSetting.allMessages && this.userChatGPTSetting.allMessages.length > 0) {
        this.userChatGPTSetting.allMessages.find(rm => rm.resourceProvider==this.currentResourceProvider)?.
                                  messages.forEach((m: ChatMessage) => {m.messageDisplayDate = this.displayMessageDate(new Date(m.timestamp));});
        this._chatContextService.messages = this.userChatGPTSetting.allMessages.find(rm => rm.resourceProvider==this.currentResourceProvider)?.messages??[];
      }
      
      this.checkMessageCount();
    });
  }

  checkSameDay(dayts){
    var today = new Date().setHours(0, 0, 0, 0);
    var thatDay = new Date(dayts).setHours(0, 0, 0, 0);
    return today === thatDay;
  }

  displayMessageDate(timestamp){
    return timestamp.getHours() + ":" + timestamp.getMinutes() + "   " + (timestamp.getMonth()+1) + "/" + timestamp.getDate() + "/" + timestamp.getFullYear();
  }

  checkMessageCount(){
    if (this.userChatGPTSetting && this.userChatGPTSetting.allMessages && this.userChatGPTSetting.allMessages.length > 0) {
      this.userChatGPTSetting.messageDailyCount = this.userChatGPTSetting.allMessages.
                                                      map((rm: ResourceProviderMessages) => rm.messages.filter((m: ChatMessage) => m.messageSource == MessageSource.User && this.checkSameDay(m.timestamp)).length).
                                                      reduce((partialSum, a) => partialSum + a, 0);
      if (this.userChatGPTSetting.messageDailyCount >= this.dailyMessageQuota) {
        this._chatContextService.chatInputBoxDisabled = true;
        this.showMessageQuotaError = true;
        this.showMessageQuotaWarning = false;
        return false;
      }
      else if (this.userChatGPTSetting.messageDailyCount >= this.dailyMessageQuota - this.messageQuotaWarningThreshold) {
        this.showMessageQuotaWarning = true;
        this.showMessageQuotaError = false;
      }
    }
    return true;
  }

  saveUserSetting() {
    let idx = this.userChatGPTSetting.allMessages.findIndex(t => t.resourceProvider == this.currentResourceProvider);
    if (idx >= 0) {
      this.userChatGPTSetting.allMessages[idx].messages = this._chatContextService.messages;
    }
    else {
      this.userChatGPTSetting.allMessages.push({resourceProvider: this.currentResourceProvider, messages: this._chatContextService.messages});
    }
    this.userChatGPTSetting.messageDailyCount = this.userChatGPTSetting.allMessages.
                                                    map((rm: ResourceProviderMessages) => rm.messages.filter((m: ChatMessage) => m.messageSource == MessageSource.User && this.checkSameDay(m.timestamp)).length).
                                                    reduce((partialSum, a) => partialSum + a, 0);
    this._userSettingService.updateUserChatGPTSetting(this.userChatGPTSetting).subscribe((settings) => {
      this.userChatGPTSetting = JSON.parse(settings.userChatGPTSetting);
    });
  }

  scrollToBottom() {
    var allChatMessages = document.getElementsByClassName("chatgpt-message-box");
    if (allChatMessages.length > 0) {
      allChatMessages[allChatMessages.length - 1].scrollIntoView();
    }
  }

  /**ChatGPT section */
  fetchOpenAIResult(searchQuery: string, messageObj: ChatMessage, retry: boolean = true, trimnewline: boolean = true) {
    this._chatContextService.chatInputBoxDisabled = true;
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
            messageObj.messageDisplayDate = this.displayMessageDate(new Date());

            this.saveUserSetting();
            this.chatgptSearchText = "";
            this._chatContextService.chatInputBoxDisabled = false;
            this.scrollToBottom();
            setTimeout(() => {
              document.getElementById(`chatGPTInputBox`).focus();
            }, 200);
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
    messageObj.messageDisplayDate = this.displayMessageDate(new Date());
    this.chatgptSearchText = "";
    this._chatContextService.chatInputBoxDisabled = false;
    this.scrollToBottom();
    document.getElementById("chatGPTInputBox").focus();
  }

  chatgptSearchText: string = "";
  chatQuerySamples: any[] = [
    {key: "How to configure autoscale for Azure App Service?", value: "How to configure autoscale for Azure App Service?"},
    {key: "What is the meaning of 500.19 error?", value: "What is the meaning of 500.19 error?"},
    {key: "Summarize this exception message: Application: Crashmon.exe....", value: `Summarize this exception message: Application: Crashmon.exe
    Framework Version: v4.0.30319
    Description: The process was terminated due to an unhandled exception.
    Exception Info: System.Net.WebException
       at System.Net.HttpWebRequest.EndGetResponse(System.IAsyncResult)
       at System.Net.Http.HttpClientHandler.GetResponseCallback(System.IAsyncResult)
    
    Exception Info: System.Net.Http.HttpRequestException
       at System.Runtime.CompilerServices.TaskAwaiter.ThrowForNonSuccess(System.Threading.Tasks.Task)
       at System.Runtime.CompilerServices.TaskAwaiter.HandleNonSuccessAndDebuggerNotification(System.Threading.Tasks.Task)
       at System.Runtime.CompilerServices.TaskAwaiter.ValidateEnd(System.Threading.Tasks.Task)
       at Microsoft.Azure.Storage.Core.Executor.Executor+<ExecuteAsync>d__1\`1[[System.__Canon, mscorlib, Version=4.0.0.0, Culture=neutral, PublicKeyToken=b77a5c561934e089]].MoveNext()
    
    Exception Info: Microsoft.Azure.Storage.StorageException
       at Microsoft.Azure.Storage.Core.Executor.Executor+<ExecuteAsync>d__1\`1[[System.__Canon, mscorlib, Version=4.0.0.0, Culture=neutral, PublicKeyToken=b77a5c561934e089]].MoveNext()
       at System.Runtime.CompilerServices.TaskAwaiter.ThrowForNonSuccess(System.Threading.Tasks.Task)
       at System.Runtime.CompilerServices.TaskAwaiter.HandleNonSuccessAndDebuggerNotification(System.Threading.Tasks.Task)
       at Microsoft.Azure.Storage.Core.Executor.Executor+<>c__DisplayClass0_0\`1[[System.__Canon, mscorlib, Version=4.0.0.0, Culture=neutral, PublicKeyToken=b77a5c561934e089]].<ExecuteSync>b__0()
       at Microsoft.Azure.Storage.Core.Util.CommonUtility.RunWithoutSynchronizationContext[[System.__Canon, mscorlib, Version=4.0.0.0, Culture=neutral, PublicKeyToken=b77a5c561934e089]](System.Func\`1<System.__Canon>)
       at Microsoft.Azure.Storage.Core.Executor.Executor.ExecuteSync[[System.__Canon, mscorlib, Version=4.0.0.0, Culture=neutral, PublicKeyToken=b77a5c561934e089]](Microsoft.Azure.Storage.Core.Executor.RESTCommand\`1<System.__Canon>, Microsoft.Azure.Storage.RetryPolicies.IRetryPolicy, Microsoft.Azure.Storage.OperationContext)
       at Microsoft.Azure.Storage.Blob.CloudBlobContainer.ListBlobsSegmented(System.String, Boolean, Microsoft.Azure.Storage.Blob.BlobListingDetails, System.Nullable\`1<Int32>, Microsoft.Azure.Storage.Blob.BlobContinuationToken, Microsoft.Azure.Storage.Blob.BlobRequestOptions, Microsoft.Azure.Storage.OperationContext)
       at Microsoft.Azure.Storage.Blob.CloudBlobContainer.ListBlobsSegmented(Microsoft.Azure.Storage.Blob.BlobContinuationToken)
       at CrashmonCommon.Storage.GetFileCount(System.String)
       at Crashmon.CrashMonitor.ValidateConfiguration(CrashmonCommon.MonitoringSettings ByRef)
       at Crashmon.CrashMonitor.Monitor(System.String[])
       at Crashmon.Program.Main(System.String[])`},
    {key: "How to configure Virtual Network on Azure Kubernetes cluster?", value: "How to configure Virtual Network on Azure Kubernetes cluster?"},
    {key: "What are the Azure App Service resiliency features?", value: "What are the Azure App Service resiliency features?"},
    {key: "How to integrate KeyVault in Azure Function App using azure cli?", value: "How to integrate KeyVault in Azure Function App using azure cli?"},
  ];

  prepareChatContext(){
    //Take last 10 messages to build context
    return this._chatContextService.messages.slice(-10).map(x => `${x.messageSource}: ${x.message}`).join('\n');
  }

  onchatSampleClick(idx: number){
    this.chatgptSearchText = this.chatQuerySamples[idx].value;
    this.triggerChat();
  }

  triggerChat(){
    //TODO: Validate message count here
    //TODO: Validate message length here
    this._chatContextService.messages.push({
      id: uuid(),
      message: this.chatgptSearchText,
      displayedMessage: this.chatgptSearchText,
      messageSource: MessageSource.User,
      timestamp: new Date().getTime(),
      messageDisplayDate: this.displayMessageDate(new Date()),
      status: MessageStatus.Finished,
      renderingType: MessageRenderingType.Text
    });
    this._chatContextService.chatInputBoxDisabled = true;
    let chatMessage = {
      id: uuid(),
      message: "",
      displayedMessage: "",
      messageSource: MessageSource.System,
      timestamp: new Date().getTime(),
      messageDisplayDate: this.displayMessageDate(new Date()),
      status: MessageStatus.Created,
      renderingType: MessageRenderingType.Text
    };
    this._chatContextService.messages.push(chatMessage);
    this.scrollToBottom();
    this.fetchOpenAIResult(this.prepareChatContext(), chatMessage);
  }
  /** */
}  
