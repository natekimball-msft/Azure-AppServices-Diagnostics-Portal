import { catchError, map } from 'rxjs/operators';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { TextCompletionModel, ChatCompletionModel, OpenAIAPIResponse, ChatResponse } from "diagnostic-data";
import { DiagnosticApiService } from './diagnostic-api.service';
import { HttpHeaders } from "@angular/common/http";
import { ResourceService } from './resource.service';

@Injectable()
export class ApplensOpenAIChatService {

  content: any[] = [];

  private textCompletionApiPath: string = "api/openai/runTextCompletion";
  private chatCompletionApiPath: string = "api/openai/runChatCompletion";
  public isEnabled: boolean = false;
  private resourceProvider: string;
  private productName: string;


  constructor(private _backendApi: DiagnosticApiService, private _resourceService: ResourceService) {
    this.resourceProvider = `${this._resourceService.ArmResource.provider}/${this._resourceService.ArmResource.resourceTypeName}`.toLowerCase();
    this.productName = this._resourceService.searchSuffix + ((this.resourceProvider === 'microsoft.web/sites') ? ` ${this._resourceService.displayName}` : '');
  }

  public CheckEnabled(): Observable<boolean> {
    return this._backendApi.get<boolean>(`api/openai/enabled`).pipe(map((value: boolean) => { this.isEnabled = value; return value; }), catchError((err) => of(false)));
  }

  public generateTextCompletion(queryModel: TextCompletionModel, customPrompt: string = '', caching: boolean = true): Observable<ChatResponse> {
    if (customPrompt && customPrompt.length > 0) {
      queryModel.prompt = `${customPrompt}\n${queryModel.prompt}`;
    }
    else {
      queryModel.prompt = `You are helping eningeers to debug issues related to ${this.productName}. Do not be repetitive when providing steps in your answer. Please answer the below question\n${queryModel.prompt}`;
    }

    return this._backendApi.post(this.textCompletionApiPath, { payload: queryModel }, new HttpHeaders({ "x-ms-openai-cache": caching.toString() })).pipe(map((res: OpenAIAPIResponse) => {

      let chatResponse: ChatResponse = {
        text: res?.choices[0].text,
        truncated: res?.choices[0].finish_reason == "length"
      };

      return chatResponse;
    }));
  }

  public getChatCompletion(queryModel: ChatCompletionModel, customPrompt: string = ''): Observable<ChatResponse> {

    if (customPrompt && customPrompt.length > 0) {
      queryModel.messages.unshift({
        "role": "user",
        "content": customPrompt
      });
    }

    queryModel.metadata["azureServiceName"] = this.productName;
    
    return this._backendApi.post(this.chatCompletionApiPath, queryModel, null, true, true).pipe(map((res: any) => {

      let chatResponse: ChatResponse = {
        text: res?.choices[0].message.content,
        truncated: res?.choices[0].finishReason == "length"
      };

      return chatResponse;
    }));
  }
}