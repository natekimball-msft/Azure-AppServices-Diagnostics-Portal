import { Injectable } from '@angular/core';
import { ChatCompletionModel, TextCompletionModel, ChatResponse } from '../models/openai-data-models';
import { Observable, of } from 'rxjs';

@Injectable()
export class GenericOpenAIChatService {
  public isEnabled: boolean = false;

  public CheckEnabled(): Observable<boolean> {
    return of(false);
  }

  public generateTextCompletion(queryModel: TextCompletionModel, customPrompt: string = '', caching: boolean = true): Observable<ChatResponse> {
    return null;
  }

  public getChatCompletion(queryModel: ChatCompletionModel, customPrompt: string = ''): Observable<ChatResponse> {
    return null;
  }
}
