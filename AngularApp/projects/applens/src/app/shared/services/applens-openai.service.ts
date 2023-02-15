import {map } from 'rxjs/operators';
import { Injectable } from '@angular/core';
import { Observable, of  } from 'rxjs';
import { TextCompletionModel, OpenAIAPIResponse } from "diagnostic-data";
import { DiagnosticApiService } from './diagnostic-api.service';
import { HttpHeaders } from "@angular/common/http";
import { ResourceService } from './resource.service';

@Injectable()
export class ApplensOpenAIService {

  content: any[] = [];

  private completionApiPath: string = "api/openai/runTextCompletion";
  public isEnabled: boolean = false;
  
  constructor(private _backendApi: DiagnosticApiService, private _resourceService: ResourceService) { 
    this._backendApi.get<boolean>(`api/openai/enabled`).subscribe((value: boolean) => {
      this.isEnabled = value;
    },
    (err) => {
      //Log this error
      this.isEnabled = false;
    });
  }

  public generateTextCompletion(queryModel: TextCompletionModel, caching: boolean = true): Observable<OpenAIAPIResponse> {
    var productName = this._resourceService.searchSuffix;
    queryModel.prompt = `ProductName: ${productName}\n${queryModel.prompt}`;
    return this._backendApi.post(this.completionApiPath, {payload: queryModel}, new HttpHeaders({"x-ms-openai-cache": caching.toString()})).pipe(map((response: OpenAIAPIResponse) => {
      return response;
    }));
  }
}