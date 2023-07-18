import { KeyValuePair } from 'projects/diagnostic-data/src/lib/models/common-models';
import {v4 as uuid} from 'uuid';
export interface ChatFeedbackAdditionalField {
    id:string, 
    labelText:string, 
    defaultValue:string,
    value:string,
    isMultiline:boolean
  }

  export interface ChatFeedbackValidationStatus {
    succeeded:boolean,
    validationStatusResponse:string
  }
  
  export class ChatFeedbackModel {
    private _id: string;
    public get id() : string { return this._id;}

    private _timestamp:Date;
    public get timestamp() : Date { return this._timestamp;}

    provider:string;
    resourceType:string;
    chatIdentifier: string;
    userQuestion: string;
    incorrectSystemResponse: string;
    expectedResponse: string;
    additionalFields: ChatFeedbackAdditionalField[];
    submittedBy:string;
    feedbackExplanation:string;
    validationStatus:ChatFeedbackValidationStatus;
    resourceSpecificInfo:KeyValuePair[];
    feedbackIdsLinkedToIncorrectResponse:string[];

    public constructor(chatIdentidier:string, submittedBy:string, provider:string, resourceType:string) {
      this._id = uuid();
      this._timestamp = new Date();
      if(!chatIdentidier) {
        chatIdentidier = 'Default';
      }
      this.provider = provider;
      this.resourceType = resourceType;
      this.chatIdentifier = chatIdentidier;
      this.submittedBy = submittedBy;
      this.additionalFields = [];
      this.validationStatus = {
        succeeded: false,
        validationStatusResponse: 'Uninitialized'
      };
      this.resourceSpecificInfo = [];
      this.feedbackIdsLinkedToIncorrectResponse = [];      
    }
  }