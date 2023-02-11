import {map, catchError } from 'rxjs/operators';
import { Injectable } from '@angular/core';
import { Observable, of  } from 'rxjs';
import { BackendCtrlService } from '../../shared/services/backend-ctrl.service';
import {TextCompletionModel, OpenAIAPIResponse} from "diagnostic-data";
import { HttpHeaders } from '@angular/common/http';

@Injectable()
export class OpenAIService {

  content: any[] = [];

  private completionApiPath: string = "api/openai/runTextCompletion";
  public isEnabled: boolean = false;
  
  constructor(private _backendApi: BackendCtrlService) { 
    this._backendApi.get<boolean>(`api/openai/enabled`).subscribe((value: boolean) => {
      this.isEnabled = value;
    },
    (err) => {
      //Log this error
      this.isEnabled = false;
    });
  }

  public generateTextCompletion(queryModel: TextCompletionModel, caching: boolean = true): Observable<OpenAIAPIResponse> {
    return this._backendApi.post(this.completionApiPath, {payload: queryModel}, new HttpHeaders({"x-ms-openai-cache": caching.toString()})).pipe(map((response: OpenAIAPIResponse) => {
      return response;
    }));
  }
}