export interface ChatFeedbackAdditionalFields {
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
  
  export interface ChatFeedbackModel {
    userQuestion: string;
    incorrectSystemResponse: string;
    expectedResponse: string;
    additionalFields: ChatFeedbackAdditionalFields[];
    validationStatus:ChatFeedbackValidationStatus;
  }