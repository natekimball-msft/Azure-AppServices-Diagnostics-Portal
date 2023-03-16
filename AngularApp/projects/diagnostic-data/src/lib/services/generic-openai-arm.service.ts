import { Injectable } from '@angular/core';
import { Observable, of} from 'rxjs';

@Injectable()
export class GenericOpenAIArmService {
  public isEnabled: boolean = false;
  
  public CheckEnabled(): Observable<boolean> {
    return of(false);
  }

  public getAnswer(questionString: any, caching: boolean = true): Observable<any> {
    return of(null);
  }
}
