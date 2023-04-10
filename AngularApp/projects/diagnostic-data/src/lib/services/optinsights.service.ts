import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';


@Injectable()
export class OptInsightsGenericService {

    getInfoForOptInsights(appInsightsResourceId: string, appId: string): Observable<any[] | null> {
        return of(null);
    }
}
