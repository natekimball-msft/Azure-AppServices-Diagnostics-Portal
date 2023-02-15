import { Injectable } from '@angular/core';
import { TextCompletionModel, OpenAIAPIResponse } from '../models/openai-data-models';
import { Observable, Subject} from 'rxjs';

@Injectable()
export class GenericOpenAIService {
  public isEnabled: boolean = false;
  public IsEnabledUpdated: Subject<boolean> = new Subject<boolean>();

  public CheckEnabled(): Subject<boolean> {
    return this.IsEnabledUpdated;
  }

  public generateTextCompletion(queryModel: TextCompletionModel, caching: boolean = true): Observable<OpenAIAPIResponse> {
    return null;
  }
}
