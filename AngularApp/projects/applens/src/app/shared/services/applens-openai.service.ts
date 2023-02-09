import {map } from 'rxjs/operators';
import { Injectable } from '@angular/core';
import { Observable, of  } from 'rxjs';
import {TextCompletionModel, OpenAIAPIResponse} from "diagnostic-data";
import { DiagnosticApiService } from './diagnostic-api.service';

@Injectable()
export class ApplensOpenAIService {

  content: any[] = [];

  private completionApiPath: string = "api/openai/runTextCompletion";
  public isEnabled: boolean = false;
  
  constructor(private _backendApi: DiagnosticApiService) { 
    this._backendApi.get<boolean>(`api/openai/enabled`).subscribe((value: boolean) => {
      this.isEnabled = value;
    },
    (err) => {
      //Log this error
      this.isEnabled = false;
    });
  }

  public generateTextCompletion(queryModel: TextCompletionModel): Observable<OpenAIAPIResponse> {
    return this._backendApi.post(this.completionApiPath, {payload: queryModel}).pipe(map((response: OpenAIAPIResponse) => {
      return response;
    }));
  }
}