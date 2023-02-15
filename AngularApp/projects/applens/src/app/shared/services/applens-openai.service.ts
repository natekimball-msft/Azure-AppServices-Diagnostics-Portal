import {map } from 'rxjs/operators';
import { Injectable } from '@angular/core';
import { Observable, of, Subject  } from 'rxjs';
import { TextCompletionModel, OpenAIAPIResponse } from "diagnostic-data";
import { DiagnosticApiService } from './diagnostic-api.service';
import { HttpHeaders } from "@angular/common/http";
import { ResourceService } from './resource.service';

@Injectable()
export class ApplensOpenAIService {

  content: any[] = [];

  private completionApiPath: string = "api/openai/runTextCompletion";
  public isEnabled: boolean = false;
  public IsEnabledUpdated: Subject<boolean> = new Subject<boolean>();

  public CheckEnabled(): Subject<boolean> {
    return this.IsEnabledUpdated;
  }
  
  constructor(private _backendApi: DiagnosticApiService, private _resourceService: ResourceService) { 
    this._backendApi.get<boolean>(`api/openai/enabled`).subscribe((value: boolean) => {
      this.isEnabled = value;
      this.IsEnabledUpdated.next(this.isEnabled);
    },
    (err) => {
      //Log this error
      this.isEnabled = false;
      this.IsEnabledUpdated.next(this.isEnabled);
    });
  }

  public generateTextCompletion(queryModel: TextCompletionModel, caching: boolean = true): Observable<OpenAIAPIResponse> {
    var productName = this._resourceService.searchSuffix;
    queryModel.prompt = `Please answer questions about ${productName}\n${queryModel.prompt}:`;
    return this._backendApi.post(this.completionApiPath, {payload: queryModel}, new HttpHeaders({"x-ms-openai-cache": caching.toString()})).pipe(map((response: OpenAIAPIResponse) => {
      return response;
    }));
  }
}