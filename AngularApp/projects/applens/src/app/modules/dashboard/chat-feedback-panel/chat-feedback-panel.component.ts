import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ChatMessage, ChatModel, ChatResponse, ChatUIContextService, CreateChatCompletionModel, CreateTextCompletionModel, 
  FeedbackOptions, GenericOpenAIChatService, MessageRenderingType, MessageSource, MessageStatus, ResponseTokensSize, StringUtilities, TextModels, TimeUtilities } from 'diagnostic-data';
import { ApplensGlobal } from '../../../applens-global';
import { IButtonStyles, ITextFieldProps, PanelType } from 'office-ui-fabric-react';
import { Observable, Subscription, of } from 'rxjs';
import {v4 as uuid} from 'uuid';
import { ChatFeedbackModel, ChatFeedbackValidationStatus } from '../../../shared/models/openAIChatFeedbackModel';

@Component({
  selector: 'chat-feedback-panel',
  templateUrl: './chat-feedback-panel.component.html',
  styleUrls: ['./chat-feedback-panel.component.scss']
})
export class ChatFeedbackPanelComponent implements OnInit {
  type: PanelType = PanelType.custom;
  @Input() width: string = "850px";
  
  _chatMessages: ChatMessage[] = [];
  get chatMessages(): ChatMessage[] {
    return this._chatMessages;
  }

  /// It is the list of chat messages that the user has seen. If this is supplied, messages fro, chatContextService will be ignored.
  @Input() set chatMessages(value:ChatMessage[]) {
    if(value) {
      this._chatMessages = value;
      this.initValues();
    }
    else {
      this._chatMessages = [];
    }
  }

  /// If chatMessages is empty or not supplied, then up to these many recent messages will be retrieved from chatContextService by chatIdentidier and used to generate feedback. This should also be accompanied with chatIdentidier else this is ignored.
  @Input() chatContextLength: number = 2;
  
  /// If chatMessages is empty or not supplied, then up to chatContextLength recent messages will be retrieved from chatContextService and used to generate feedback.
  @Input() chatIdentifier: string;
  
  @Input() chatModel: ChatModel = ChatModel.GPT4;
  @Input() responseTokenSize: ResponseTokensSize = ResponseTokensSize.Large;

  @Input() headerText: string = "Feedback to improve AI generated response.";

  @Input() additionalFields: {id:string, labelText:string, value:string, isMultiline:boolean}[]= [{
    id: 'cluster',
    labelText: 'Cluster',
    value: '@AntaresStampCluster',
    isMultiline: false
  },
  {
    id: 'database',
    labelText: 'Database',
    value: 'wawsprod',
    isMultiline: false
  }];



  _visible: boolean = false;
  get visible(): boolean {
    return this._visible;
  }
  @Input() set visible(value:boolean) {
    this._visible = value;

  }
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() onDismissed = new EventEmitter<void>();
  @Input() onBeforeSubmit: (feedbackModel: ChatFeedbackModel) => Observable<ChatFeedbackModel> ;

  public statusMessage = '';
    
  private openAIAPICallSubscription:Subscription;
  private currentApiCallCount:number = 0;
  private openAIApiCallLimit = 10;

  fabTextFieldStyles: ITextFieldProps["styles"] = {
    wrapper: {
      display: 'flex',
      justifyContent: 'space-between',
      margin: '1.5em'
    },
    field: {
      width: '500px'
    },
    subComponentStyles: {
      label: {
        root: {fontWeight: 700}
      }
    }
  }

  fabDefaultButtonStyle: IButtonStyles = {
    root: {
      margin: "1.5em",
    }
  }

  feedbackUserQuestion:ChatMessage;
  systemResponse:ChatMessage;
  correctResponseFeedback:string = '';
  
  // correct question to ask for this is "What is the daily trend of most used outbound trigger by Function apps over the past week?"
  anotherSystemResponse: string = `WawsAn_omgsitefunctionsentity
  | where pdate >= ago(7d)
  | summarize Count = count() by OutputBindings, bin(pdate, 1d)
  | top 1 by Count desc
  | extend MostUsedOutputBinding = OutputBindings
  | join kind=inner (
      WawsAn_omgsitefunctionsentity
      | where pdate >= ago(7d)
      | summarize Count = count() by OutputBindings, bin(pdate, 1d)
  ) on pdate
  | where OutputBindings == MostUsedOutputBinding
  | project pdate, MostUsedOutputBinding, Count
  | order by pdate asc
  | render timechart`;
  correctSystemResponse:string = `let mostUsedOutputBinding = WawsAn_omgsitefunctionsentity
  | where pdate >= ago(7d)
  | where isnotempty( OutputBindings)
  | summarize Count = count() by OutputBindings 
  | extend Expanded = split(tolower(OutputBindings), ',')
  | mv-expand Expanded to typeof(string)
  | summarize Count  = sum(Count) by OutputBindings = Expanded
  | where isnotempty( OutputBindings)
  | summarize Count = sum(Count) by OutputBindings
  | top 1 by Count desc 
  | project OutputBindings;
let dailyTrendOutputBindings = WawsAn_omgsitefunctionsentity
  | where pdate >= ago(7d)
  | where isnotempty( OutputBindings)
  | summarize Count = count() by bin(pdate, 1d), OutputBindings 
  | extend Expanded = split(tolower(OutputBindings), ',')
  | mv-expand Expanded to typeof(string)
  | summarize Count  = sum(Count) by bin(pdate, 1d), OutputBindings = Expanded
  | where isnotempty( OutputBindings);
mostUsedOutputBinding
| join kind=inner (
    dailyTrendOutputBindings
) on OutputBindings
| project pdate, OutputBindings, Count
| render timechart`;
  

  public dismissedHandler() {
    this.visible = false;
    this.visibleChange.emit(this.visible);
    this.onDismissed.emit();
  }

  constructor(private _applensGlobal:ApplensGlobal, private _openAIService: GenericOpenAIChatService, private _chatContextService: ChatUIContextService) {
    // this._applensGlobal.updateHeader('KQL for Antares Analytics'); // This sets the title of the HTML page
    // this._applensGlobal.updateHeader(''); // Clear the header title of the component as the chat header is being displayed in the chat UI
    // this.prepareChatHeader();
    this.chatMessages = [];
    
    this.chatMessages.push({
      id: "1",
      message: "Write a Kusto query to get the top used outbound trigger for function apps.",
      displayMessage: "Write a Kusto query to get the top used outbound trigger for function apps.",
      messageSource: MessageSource.User,
      userFeedback: FeedbackOptions.None,
      timestamp: 1,
      messageDisplayDate: "",
      renderingType: MessageRenderingType.Text,
      status: MessageStatus.Finished
    });

    this.chatMessages.push({
      id: "2",
      message: `To find the most used outbound trigger by Function apps, you can use the following Kusto query:

      WawsAn_omgsitefunctionsentity
      | where pdate >= ago(3d)
      | summarize Count = count() by OutputBindings
      | order by Count desc
      | take 1
      
      Explanation: This query looks at the last 3 days worth of data from the WawsAn_omgsitefunctionsentity table, summarizing the count of occurrences by OutputBindings. It then sorts the results by the count in descending order and takes the top most result, which represents the most used outbound trigger.`,
      displayMessage: `To find the most used outbound trigger by Function apps, you can use the following Kusto query:

      WawsAn_omgsitefunctionsentity
      | where pdate >= ago(3d)
      | summarize Count = count() by OutputBindings
      | order by Count desc
      | take 1
      
      Explanation: This query looks at the last 3 days worth of data from the WawsAn_omgsitefunctionsentity table, summarizing the count of occurrences by OutputBindings. It then sorts the results by the count in descending order and takes the top most result, which represents the most used outbound trigger.`,
      messageSource: MessageSource.System,
      userFeedback: FeedbackOptions.None,
      timestamp: 2,
      messageDisplayDate: "",
      renderingType: MessageRenderingType.Markdown,
      status: MessageStatus.Finished
    });

    this.chatMessages.push({
      id: "3",
      message: "show me a daily trend of this over the past week",
      displayMessage: "show me a daily trend of this over the past week",
      messageSource: MessageSource.User,
      userFeedback: FeedbackOptions.None,
      timestamp: 1,
      messageDisplayDate: "",
      renderingType: MessageRenderingType.Text,
      status: MessageStatus.Finished
    });

    this.chatMessages.push({
      id: "4",
      message: this.anotherSystemResponse,//"To analyze the daily trend of the most used outbound trigger by Function apps over the past week, you can use the WawsAn_omgsitefunctionsentity table.",
      displayMessage: this.anotherSystemResponse,//"To analyze the daily trend of the most used outbound trigger by Function apps over the past week, you can use the WawsAn_omgsitefunctionsentity table.",
      messageSource: MessageSource.System,
      userFeedback: FeedbackOptions.Dislike,
      timestamp: 1,
      messageDisplayDate: "",
      renderingType: MessageRenderingType.Markdown,
      status: MessageStatus.Finished
    });
  }

  ngOnInit(): void {
    this.initValues();
  }

  private initValues(): void {
    this.statusMessage = '';
    if(this.chatMessages && this.chatMessages.length > 0) {
      
      let chatMessagesToWorkWith:ChatMessage[] = [];
      // Update user question
      if(this.chatMessages && this.chatMessages.length > 0 && this.chatMessages.some(message => message.messageSource == MessageSource.User) ) {
        chatMessagesToWorkWith = this.chatMessages;
      }
      else {
        if(this.chatIdentifier && this._chatContextService.messageStore[this.chatIdentifier] && this._chatContextService.messageStore[this.chatIdentifier].length > 0 ) {
          chatMessagesToWorkWith = this._chatContextService.messageStore[this.chatIdentifier].slice(-1 * this.chatContextLength);
        }
      }

      if(chatMessagesToWorkWith && chatMessagesToWorkWith.length > 0) {
        let lastDislikeSystemMessageIndex = -1;
        let dislikedSystemMessage = null;
        let lastUserMessageBeforeDislike = null;
        
        for (let i = chatMessagesToWorkWith.length - 1; i >= 0; i--) {
          const message = chatMessagesToWorkWith[i];
          if (message.messageSource === MessageSource.System && message.userFeedback === FeedbackOptions.Dislike) {
            lastDislikeSystemMessageIndex = i;
            dislikedSystemMessage = message;
            break;
          }
          else {
            dislikedSystemMessage = message;
          }

          if (message.messageSource === MessageSource.User) {
            lastUserMessageBeforeDislike = message;
          }
        }

        if (lastDislikeSystemMessageIndex !== -1) {
          lastUserMessageBeforeDislike = null;
          for (let i = lastDislikeSystemMessageIndex - 1; i >= 0; i--) {
            const message = chatMessagesToWorkWith[i];
            if (message.messageSource === MessageSource.User) {
              lastUserMessageBeforeDislike = message;
              break;
            }
          }
        }

        this.systemResponse = dislikedSystemMessage;
        this.feedbackUserQuestion = lastUserMessageBeforeDislike;

        let chatMessagesToConstructUserQuestionFrom = chatMessagesToWorkWith.slice(0, chatMessagesToWorkWith.findIndex(message => message.id === lastUserMessageBeforeDislike.id) + 1);
        if(chatMessagesToConstructUserQuestionFrom && chatMessagesToConstructUserQuestionFrom.length > 0 && chatMessagesToConstructUserQuestionFrom.filter(message => message.messageSource === MessageSource.User).length > 1) {
          // Construct a composite user question via OpenAI
          this._openAIService.CheckEnabled().subscribe((enabled) => {
            if(enabled) {
              this.currentApiCallCount = 0;

              this.fetchOpenAIResultAsChatMessageUsingRest(this.prepareChatHistory(chatMessagesToConstructUserQuestionFrom), this.GetEmptyChatMessage(), true, true, this.chatModel, 
                'You are a chat assistant that helps consolidate the users final message in the form of a question. Given the current chat history, help construct a question for the user that can be answered by the system. Do not answer the users question, the goal is to only contruct a consolidated user question.')
                .subscribe((messageObj) => {
                  if(messageObj && messageObj.status === MessageStatus.Finished && !`${messageObj.displayMessage}`.startsWith('Error: ')  ) {
                    this.feedbackUserQuestion = messageObj;
                    this.statusMessage = 'Note: User question was updated based on the chat history. Please validate the question before submitting.';
                  }
                });
            }
          });
        }
      }
    }
  }

  private GetEmptyChatMessage(): ChatMessage {
    return {
      id: uuid(),
      message: "",
      displayMessage: "",
      messageSource: MessageSource.System,
      timestamp: new Date().getTime(),
      messageDisplayDate: TimeUtilities.displayMessageDate(new Date()),
      status: MessageStatus.Created,
      userFeedback: FeedbackOptions.None,
      renderingType: MessageRenderingType.Text
    };
  }

  private fetchOpenAIResultAsChatMessageUsingRest(chatHistory: any, messageObj: ChatMessage, retry: boolean = true, trimnewline: boolean = false, chatModel:ChatModel, customInitialPrompt:string): Observable<ChatMessage> {
    if (this.currentApiCallCount >= this.openAIApiCallLimit) {
      this.statusMessage = "Error: OpenAI API call limit reached.";
      this.currentApiCallCount = 0;
      return of(messageObj);
    }
  
    this.currentApiCallCount++;
  
    if (messageObj.status == MessageStatus.Cancelled) {
      this.currentApiCallCount = 0;
      return of(messageObj);
    }
      
  
    let openAIAPICall: Observable<ChatResponse> = new Observable();
    this.currentApiCallCount = 0;
  
    messageObj.status = messageObj.status == MessageStatus.Created ? MessageStatus.Waiting : messageObj.status;
  
    if (chatModel == ChatModel.GPT3) {
      let openAIQueryModel = CreateTextCompletionModel(chatHistory, TextModels.Default, this.responseTokenSize);
      openAIAPICall = this._openAIService.generateTextCompletion(openAIQueryModel, customInitialPrompt, true);
    } else {
      let chatCompletionQueryModel = CreateChatCompletionModel(chatHistory, messageObj.id, this.chatIdentifier, chatModel, this.responseTokenSize);
      openAIAPICall = this._openAIService.getChatCompletion(chatCompletionQueryModel, customInitialPrompt);
    }
  
    return new Observable<ChatMessage>((observer) => {
      const subscription = openAIAPICall.subscribe( (response: ChatResponse) => {
          if (messageObj.status == MessageStatus.Cancelled) {
            this.currentApiCallCount = 0;
            observer.next(messageObj);
            observer.complete();
            return;
          }
  
          let trimmedText = chatModel == ChatModel.GPT3 ? (trimnewline ? StringUtilities.TrimBoth(response.text) : StringUtilities.TrimEnd(response.text)) : response.text;
  
          messageObj.message = StringUtilities.mergeOverlappingStrings(messageObj.message, trimmedText);
          messageObj.status = response.truncated === true ? MessageStatus.InProgress : MessageStatus.Finished;
          messageObj.displayMessage = StringUtilities.mergeOverlappingStrings(messageObj.displayMessage, trimmedText);

  
          if (response.truncated) {
            // Do not trim newline for the next query
            this.fetchOpenAIResultAsChatMessageUsingRest(chatHistory, messageObj, retry, false, chatModel, customInitialPrompt).subscribe( (result: ChatMessage) => {
                observer.next(result);
                observer.complete();
              },
              (error: any) => {
                observer.error(error);
              }
            );
          } else {
            messageObj.status =  MessageStatus.Finished;
            messageObj.timestamp = new Date().getTime();
            messageObj.messageDisplayDate = TimeUtilities.displayMessageDate(new Date());
            this.currentApiCallCount = 0;
            this.statusMessage = '';
            messageObj.displayMessage = messageObj.displayMessage.replace('System: ', '');
            messageObj.displayMessage = messageObj.displayMessage.replace('Assistant: ', '');
  
            observer.next(messageObj);
            observer.complete();
          }
        },
        (error: any) => {
          if (retry) {
            this.fetchOpenAIResultAsChatMessageUsingRest(chatHistory, messageObj, false, trimnewline, chatModel, customInitialPrompt).subscribe(
              (result: ChatMessage) => {
                this.currentApiCallCount = 0;
                observer.next(result);
                observer.complete();
              },
              (error: any) => {
                observer.error(error);
              }
            );
          } else {
            observer.error(error);
          }
        }
      );
  
      return () => {
        subscription.unsubscribe();
      };
    });
  }
  

  private fetchOpenAIResultUsingRest(chatHistory: any, messageObj: ChatMessage, retry: boolean = true, trimnewline: boolean = false, chatModel:ChatModel, customInitialPrompt:string):Observable<ChatMessage> {
    if (this.currentApiCallCount >= this.openAIApiCallLimit) {
      this.statusMessage = "Error: OpenAI API call limit reached.";
      this.currentApiCallCount = 0;
      return;
    }
    this.currentApiCallCount++;

    if(messageObj.status == MessageStatus.Cancelled) {
      this.currentApiCallCount = 0;      
      return;
    }

    this.statusMessage = '';
    let openAIAPICall: Observable<ChatResponse> = new Observable();

    try
    {
      messageObj.status = messageObj.status == MessageStatus.Created ? MessageStatus.Waiting : messageObj.status;

      if (chatModel == ChatModel.GPT3) {
        let openAIQueryModel = CreateTextCompletionModel(chatHistory, TextModels.Default, this.responseTokenSize);
        openAIAPICall = this._openAIService.generateTextCompletion(openAIQueryModel, customInitialPrompt, true);
      }
      else {
        let chatCompletionQueryModel = CreateChatCompletionModel(chatHistory, messageObj.id, this.chatIdentifier, chatModel, this.responseTokenSize);
        openAIAPICall = this._openAIService.getChatCompletion(chatCompletionQueryModel, customInitialPrompt);
      }

      this.openAIAPICallSubscription = openAIAPICall.subscribe((response: ChatResponse) => {
        if (messageObj.status == MessageStatus.Cancelled) {
          this.currentApiCallCount = 0;
          return;
        }

        let trimmedText = chatModel == ChatModel.GPT3 ? (trimnewline ? StringUtilities.TrimBoth(response.text) : StringUtilities.TrimEnd(response.text)) : response.text;
        messageObj.message = StringUtilities.mergeOverlappingStrings(messageObj.message, trimmedText);
        messageObj.status = response.truncated === true ? MessageStatus.InProgress : MessageStatus.Finished;
        messageObj.displayMessage = StringUtilities.mergeOverlappingStrings(messageObj.displayMessage, trimmedText);

        if (response.truncated) {
          //Do not trim newline for the next query
          this.fetchOpenAIResultUsingRest(chatHistory, messageObj, retry, trimnewline = false, chatModel, customInitialPrompt);
        }
        else {
          messageObj.status =  MessageStatus.Finished;
          messageObj.timestamp = new Date().getTime();
          messageObj.messageDisplayDate = TimeUtilities.displayMessageDate(new Date());
          this.currentApiCallCount = 0;
          this.statusMessage = '';          
          messageObj.displayMessage = messageObj.displayMessage.replace('System: ', '');

          this.feedbackUserQuestion = messageObj;
          return Observable.of(messageObj);
        }


      }, (err) => {
        if (err.status && err.status == 400) {
          //Sometimes the chat context may become too long for the API to handle. In that case, we reduce the chat context length by 2 and retry
          //this._telemetryService.logEvent("OpenAIChatBadRequestError", { ...err, userId: this._chatContextService.userId, ts: new Date().getTime().toString() });
          this.chatContextLength = this.chatContextLength - 2 >= 0? this.chatContextLength - 2 : 0;
          this.fetchOpenAIResultUsingRest(chatHistory, messageObj, retry = false, false, chatModel, customInitialPrompt);
        }
        else if (retry) {
          this.fetchOpenAIResultUsingRest(chatHistory, messageObj, retry = false, false, chatModel, customInitialPrompt);
        }
        else {
          this.statusMessage = "Error: " + err;
          this.currentApiCallCount = 0;
          messageObj.status =  MessageStatus.Finished;
          messageObj.timestamp = new Date().getTime();
          messageObj.messageDisplayDate = TimeUtilities.displayMessageDate(new Date());
          messageObj.message = this.statusMessage;
          messageObj.displayMessage = this.statusMessage;
          return Observable.of(messageObj);
        }
      }, () => {});
      

    }
    catch (error) {
      this.statusMessage = "Error: " + error;
      this.currentApiCallCount = 0;
      messageObj.status =  MessageStatus.Finished;
      messageObj.timestamp = new Date().getTime();
      messageObj.messageDisplayDate = TimeUtilities.displayMessageDate(new Date());
      
      return Observable.of(messageObj);;
    }


  }

  private prepareChatHistory(messagesToConsider: ChatMessage[]) {
    //Take last 'chatContextLength' messages to build context    
    if (messagesToConsider && messagesToConsider.length > 0) {
      var context;
      if (this.chatModel == ChatModel.GPT3) {
        context = messagesToConsider.map((x: ChatMessage, index: number) => {
          return `${x.messageSource}: ${ (x.displayMessage? x.displayMessage: x.message)}`;
        }).join('\n');
        return context;
      }
      else {
        context = [];
        messagesToConsider.forEach((element: ChatMessage, index: number) => {
          let role = element.messageSource == MessageSource.User ? "User" : "Assistant";
          let content = element.displayMessage? element.displayMessage : element.message ;
          if (content != '') {
            context.push({
              "role": role,
              "content": content
            });
          }
        });
        return context;
      }
    }
    return null;
  }

  public retainCursorPositon(e: { event: Event, newValue?: string }) {
    if(e && e.event && e.event.target) {
      let target = e.event.target as HTMLInputElement;
      let cursorPosition = target.selectionStart;
      setTimeout(() => {
        target.setSelectionRange(cursorPosition, cursorPosition);
      }
      , 0);
    }
  }

  updateFeedbackUserQuestion(e: { event: Event, newValue?: string }) {
    if(this.feedbackUserQuestion && e && e.newValue) {
      this.feedbackUserQuestion.displayMessage = `${e.newValue}`;
      this.feedbackUserQuestion.message = `${e.newValue}`;
    }

    this.retainCursorPositon(e);
  }

  validateFeedback() {
    if(this.correctResponseFeedback) {
      let chatFeedbackModel = {
        userQuestion: this.feedbackUserQuestion.displayMessage,
        incorrectSystemResponse: this.systemResponse.displayMessage,
        expectedResponse: this.correctResponseFeedback,
        additionalFields: this.additionalFields,
        validationStatus: <ChatFeedbackValidationStatus>{
          succeeded:true,
          validationStatusResponse: ''
        } 
      } as ChatFeedbackModel;
      if(this.onBeforeSubmit) {
        this.onBeforeSubmit(chatFeedbackModel).subscribe((validatedChatFeedback) => {
          if(validatedChatFeedback && validatedChatFeedback.validationStatus && validatedChatFeedback.validationStatus.succeeded) {
            this.statusMessage = validatedChatFeedback.validationStatus.validationStatusResponse;
            this.feedbackUserQuestion.displayMessage = validatedChatFeedback.userQuestion;
            this.feedbackUserQuestion.message = validatedChatFeedback.userQuestion;
            this.systemResponse.displayMessage = validatedChatFeedback.incorrectSystemResponse;
            this.systemResponse.message = validatedChatFeedback.incorrectSystemResponse;
            this.correctResponseFeedback = validatedChatFeedback.expectedResponse;
            this.additionalFields = validatedChatFeedback.additionalFields;
          }
          else {
            this.statusMessage = `Error: Failed to validate feedback. ${validatedChatFeedback?.validationStatus?.validationStatusResponse}`;
          }
        });
      }
      else {
        this.statusMessage = '';
        if(!this.feedbackUserQuestion.displayMessage) {
          this.statusMessage = 'Error: User question is required.';
        }
        if(!this.correctResponseFeedback) {
          this.statusMessage += '\nError:Expected response is required.';
        }

        // this._openAIService.CheckEnabled().subscribe((enabled) => {
        //   if(enabled) {
        //     this.currentApiCallCount = 0;            
        //     this.fetchOpenAIResultAsChatMessageUsingRest((this.chatModel == ChatModel.GPT3? null : []), this.GetEmptyChatMessage(), true, true, this.chatModel,
        //       `You are a chat assistant that helps reason why an answer to a question is incorrect and generates a summary reasoning about why the answer is incorrect. Given the following UserQuestion, IncorrectAnswer and CorrectAnswer, reason why the original answer was incorrect. Also include a short step by step summary of how the CorrectAnswer achieves the desired outcome.
        //       UserQuestion: ${this.feedbackUserQuestion.displayMessage}

        //       IncorrectAnswer: ${this.systemResponse.displayMessage}

        //       CorrectAnswer: ${this.correctResponseFeedback}
        //       `).subscribe((messageObj) => {
        //         if(messageObj && messageObj.status === MessageStatus.Finished && !`${messageObj.displayMessage}`.startsWith('Error: ')  ) {
        //           this.correctResponseFeedbackReasoning = messageObj.displayMessage;
        //         }
        //         else {
        //           this.statusMessage = "Error: Calling OpenAI API failed";
        //         }
        //       });
        //   }
        // });
      }
      
    }
  }

  submitChatFeedback() {
    this.validateFeedback();
  }
}