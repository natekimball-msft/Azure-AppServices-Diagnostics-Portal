import {map, catchError } from 'rxjs/operators';
import { Injectable } from '@angular/core';
import { Observable, of  } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ResourceService } from './resource.service';
import { BackendCtrlService } from '../../shared/services/backend-ctrl.service';
import {TextCompletionModel, OpenAIAPIResponse} from "diagnostic-data";

@Injectable()
export class OpenAIService {

  content: any[] = [];

  private completionApiPath: string = "api/openai/runTextCompletion";
  private isEnabled: boolean = false;
  
  constructor(private _http: HttpClient, private _resourceService: ResourceService, private _backendApi: BackendCtrlService) { 
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