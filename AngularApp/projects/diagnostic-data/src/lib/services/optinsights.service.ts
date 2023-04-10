import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, of, ReplaySubject } from 'rxjs';


@Injectable(
    {
        providedIn: 'root'
    }
)
export class OptInsightsService {

    getInfoForOptInsights(aRMToken: string, appInsightsResourceId: string, appId: string): Observable<any[] | null> {
        return null;
    }
}
