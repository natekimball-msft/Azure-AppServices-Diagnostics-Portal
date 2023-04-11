import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';


@Injectable()
export class OptInsightsGenericService {

    getInfoForOptInsights(appInsightsResourceId: string, appId: string, startTime: Date, endTime: Date): Observable<any[] | null> {
        return of(null);
    }
}
