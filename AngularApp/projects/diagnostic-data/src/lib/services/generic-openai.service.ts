import { Injectable } from '@angular/core';
import { TextCompletionModel, OpenAIAPIResponse } from '../models/openai-data-models';
import { Observable} from 'rxjs';

@Injectable()
export class GenericOpenAIService {

  public generateTextCompletion(queryModel: TextCompletionModel, caching: boolean = true): Observable<OpenAIAPIResponse> {
    return null;
  }
}
