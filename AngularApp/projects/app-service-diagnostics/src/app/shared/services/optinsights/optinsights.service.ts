import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { map, mergeMap, take, tap } from 'rxjs/operators';
import { ScopeAuthorizationToken  } from '../../models/portal';
import { PortalService } from '../../../startup/services/portal.service';


@Injectable(
  {
    providedIn: 'root'
  }
)
export class OptInsightsService {

  private readonly GATEWAY_HOST_URL: string = "https://gateway.azureserviceprofiler.net";
  private readonly OAUTH_TOKEN_API: string = "/token";
  private readonly optInsightsRole: string = 'ProfileReader';
  private readonly authEndpoint: string = "https://management.azure.com"
  private optInsightsResponse: any;
  isEnabledInProd: boolean = true;
  loading: boolean;
  dependencies: any = [];
  appInsightsValidationError: string;
  isAppInsightsEnabled: boolean = false;
  appInsightsResourceUri: string = "";
  appId: string = "";



  constructor(private http: HttpClient, private _portalService: PortalService) {
  }

  private getARMToken(): Observable<string | null> {
    const scope: ScopeAuthorizationToken = { resourceName: "profile" };
    return this._portalService.getScopedToken(scope).pipe(take(1), map(data => {
      let authData=JSON.parse(data);
      if (!authData.error) {
        let scopedToken = authData.token
        return scopedToken;
      }
      else {
        return null;
      }
    }));
  }
  
  private getOAuthAccessToken(_armToken: string, _appInsightsResourceId: string): Observable<string> {
    var _token: string = "";
    const data = `grant_type=password&username=${_appInsightsResourceId}&password=Bearer ${_armToken}&endpoint=${this.authEndpoint}&role=${this.optInsightsRole}`;
    const headers = new HttpHeaders({
      "Content-Type": "application/x-www-form-urlencoded",
      "Authorization": "" // override the default portal token
    });
    return this.http.post(`${this.GATEWAY_HOST_URL}${this.OAUTH_TOKEN_API}`, data, { headers }).pipe(
      map((response: any) => {
        _token = response.access_token;
        return _token;
      }));
  }

  getAggregatedInsightsbyTimeRange(oAuthAccessToken: string, appId: string): Observable<any[]> {
    var _startTime = new Date();
    var _endTime = new Date();
    _startTime.setDate(_startTime.getDate() - 30);

    const query: string = `${this.GATEWAY_HOST_URL}/api/apps/${appId}/aggregatedInsights/timeRange?startTime=${_startTime.toISOString()}&endTime=${_endTime.toISOString()}`;
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${oAuthAccessToken}`,
      'Content-Type': 'application/json'
    });
    return this.http.get(query, { headers: headers }).pipe(
      map((aggregatedInsights: any) => {
        this.optInsightsResponse = aggregatedInsights;
        return this.optInsightsResponse;
      }));
  }

  getInfoForOptInsights(appInsightsResourceId: string, appId: string): Observable<any[] | null> {
    return this.getARMToken().pipe(
      (mergeMap(aRMToken => {
      if (aRMToken === null || appInsightsResourceId === null || appId === null) return of(null);
        return this.getOAuthAccessToken(aRMToken, appInsightsResourceId).pipe(map(accessToken => {
          return accessToken;
        }), mergeMap(accessToken => {
          if (accessToken === null || appInsightsResourceId === null || appId === null) return of(null);
          return this.getAggregatedInsightsbyTimeRange(accessToken, appId);
        }));
      })));
  }
}
