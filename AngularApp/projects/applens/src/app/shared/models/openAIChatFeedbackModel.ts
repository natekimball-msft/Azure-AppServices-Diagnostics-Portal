export interface ChatFeedbackAdditionalFields {
    id:string, 
    labelText:string, 
    value:string, 
    isMultiline:boolean
  }
  
  export interface ChatFeedbackModel {
    userQuestion: string;
    incorrectSystemResponse: string;
    expectedResponse: string;
    additionalFields: ChatFeedbackAdditionalFields[];
    validationStatusResponse:string;
  }