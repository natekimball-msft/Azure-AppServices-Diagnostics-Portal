import { Injectable, SimpleChanges } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, forkJoin, BehaviorSubject } from 'rxjs';
import { map, mergeMap, take, tap } from 'rxjs/operators';
//import { AggregatedInsight } from '../../models/optinsights';
//import { AppInsightsService } from '../appinsights/appinsights.service';
import { ResourceType, ScopeAuthorizationToken, StartupInfo } from '../../models/portal';
import { AuthService } from '../../../startup/services/auth.service';
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
  private aRMToken: string = "";
  private aRmTokenSubject = new BehaviorSubject<string>("");
  isEnabledInProd: boolean = true;
  //private appInsightsResourceId: string = "";
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
    return this._portalService.getScopedToken(scope).pipe(map(data => {
      let authData=JSON.parse(data);
      if (!authData.error) {
        let scopedToken = authData.token
        console.log(scopedToken);
        return scopedToken;
      }
      else {
        return null;
      }
    }));
  }

  // private getAppInsightsInfo(): Observable<{ appInsightsResourceUri: string, appId: string } | null> {
  //   if (this.isEnabledInProd) {
  //     this.appInsightsValidationError = "";
  //     this._appInsightsService.loadAppInsightsResourceObservable.pipe(
  //       map(loadStatus => {
  //         if (loadStatus === true) {
  //           let appInsightsSettings = this._appInsightsService.appInsightsSettings;
  //           this.isAppInsightsEnabled = appInsightsSettings.enabledForWebApp;
  //           this.appInsightsResourceUri = appInsightsSettings.resourceUri;
  //           this.appId = appInsightsSettings.appId;
  //           return { "appInsightsResourceUri": this.appInsightsResourceUri, "appId": this.appId };
  //         }
  //         else {
  //           return null;
  //         }
  //       }));
  //   }
  //   else {
  //     return null;
  //   }
  // }

  // private getAppInsightsInfo(): { appInsightsResourceId: string, appId: string } | null {
  //   let appInsightsResourceId = this.appInsightsService.appInsightsSettings.resourceUri;
  //   let appId = this.appInsightsService.appInsightsSettings.appId;
  //   return { "appInsightsResourceId": appInsightsResourceId, "appId": appId };
  // return this.appInsightsService.loadAppInsightsResourceObservable.pipe(tap(loadStatus => console.log(loadStatus),error => console.error(error)),
  //   map(loadStatus => {
  //     if (loadStatus === true) {
  //       let appInsightsSettings = this.appInsightsService.appInsightsSettings;
  //       const appInsightsResourceId: string = appInsightsSettings.resourceId;
  //       const appId: string = appInsightsSettings.appId;
  //       return { "appInsightsResourceId": appInsightsResourceId, "appId": appId };
  //     }
  //     // else {
  //     //   return null;
  //     // }
  //   }));
  //}

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

  getAggregatedInsightsbyTimeRange(oAuthAccessToken: string, appInsightsResourceId: string, appId: string): Observable<any[]> {
    var _startTime = new Date();
    var _endTime = new Date();
    _startTime.setDate(_startTime.getDate() - 30);

    //const query: string = `${this.GATEWAY_HOST_URL}/api/apps/${appId}/aggregatedInsights/timeRange?startTime=${_startTime.toISOString()}&endTime=${_endTime.toISOString()}&role=${this.optInsightsRole}`;
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

  getInfoForOptInsights(aRMToken: string, appInsightsResourceId: string, appId: string): Observable<any[] | null> {
    // const requests = forkJoin([this.getARMToken(), this.getAppInsightsInfo().pipe(take(2))]);
    // return requests.pipe(mergeMap(res => {
    return this.getARMToken().pipe(
      (mergeMap(aRMToken => {
        //   const appInsightInfo = res[1];
        //let appInsightInfo: any = { "appInsightsResourceId": appInsightsResourceId, "appId": appId }
        if (aRMToken === null || appInsightsResourceId === null || appId === null) return of(null);
        return this.getOAuthAccessToken(aRMToken, appInsightsResourceId).pipe(map(accessToken => {
          return accessToken;
        }), mergeMap(accessToken => {
          if (accessToken === null || appInsightsResourceId === null || appId === null) return of(null);
          return this.getAggregatedInsightsbyTimeRange(accessToken, appInsightsResourceId, appId);
        }));
      })));
  }
}
