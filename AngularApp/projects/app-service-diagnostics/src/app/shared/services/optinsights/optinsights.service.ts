import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, mergeMap, retry, take, tap } from 'rxjs/operators';
import { ScopeAuthorizationToken  } from '../../models/portal';
import { PortalService } from '../../../startup/services/portal.service';
import { CacheService } from '../cache.service';
import { OperatingSystem } from 'projects/app-service-diagnostics/src/app/shared/models/site';
import { WebSitesService } from 'projects/app-service-diagnostics/src/app/resources/web-sites/services/web-sites.service';
import { ResourceService } from 'projects/app-service-diagnostics/src/app/shared-v2/services/resource.service';
import { AppType } from 'projects/app-service-diagnostics/src/app/shared/models/portal';
import { Sku } from 'projects/app-service-diagnostics/src/app/shared/models/server-farm';
import { DetectorControlService, TelemetryEventNames, TelemetryService } from 'diagnostic-data';


@Injectable()
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
  error: any;
  subscriptionId: string;
  resourcePlatform: OperatingSystem = OperatingSystem.any;
  resourceAppType: AppType = AppType.WebApp;
  resourceSku: Sku = Sku.All;
  site: any;
  startTime: string;
  endTime: string;
  
  constructor(private http: HttpClient, private _portalService: PortalService, private _cache: CacheService, private telemetryService: TelemetryService, private _resourceService: ResourceService, private _detectorControlService: DetectorControlService) {
  }

  private getARMToken(): Observable<string | null> {
    const scope: ScopeAuthorizationToken = { resourceName: "profile" };
    return this._portalService.getScopedToken(scope).pipe(take(1), map(data => {
      let authData=JSON.parse(data);
      if (!authData.error) {
        let scopedToken = authData.token
        this.logOptInsightsEvent(this.appInsightsResourceUri, TelemetryEventNames.AICodeOptimizerInsightsARMTokenSuccessful);
        return scopedToken;
      }
      else {
        this.logOptInsightsEvent(this.appInsightsResourceUri, TelemetryEventNames.AICodeOptimizerInsightsARMTokenFailure, authData.error);
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
        this.logOptInsightsEvent(this.appInsightsResourceUri, TelemetryEventNames.AICodeOptimizerInsightsOAuthAccessTokenSuccessful);
        return _token;
      },(error:any) => {
        this.error = error;
        this.logOptInsightsEvent(this.appInsightsResourceUri, TelemetryEventNames.AICodeOptimizerInsightsOAuthAccessTokenFailure, error);
      }));
  }

  getAggregatedInsightsbyTimeRange(oAuthAccessToken: string, appId: string, startTime: Date, endTime: Date, invalidateCache: boolean = false, type?:string): Observable<any[]> {
    var _startTime: Date = startTime;
    var _endTime:Date = endTime;
    
    const query: string = `${this.GATEWAY_HOST_URL}/api/apps/${appId}/aggregatedInsights/timeRange?startTime=${_startTime.toISOString()}&endTime=${_endTime.toISOString()}`;
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${oAuthAccessToken}`,
      'Content-Type': 'application/json'
    });
    const request = this.http.get(query, { headers: headers }).pipe(
      retry(2),
      map((aggregatedInsights: any) => {
        this.optInsightsResponse = aggregatedInsights;
        this.logOptInsightsEvent(this.appInsightsResourceUri, TelemetryEventNames.AICodeOptimizerInsightsAggregatedInsightsbyTimeRangeSuccessful, aggregatedInsights.length);        
        if (this.optInsightsResponse.length <= 1){
          return this.optInsightsResponse;
        }
        else{
          if (type != undefined){
            return this.getTopTypebyImpact(this.optInsightsResponse, type, 3);
          }
          else{
             return [].concat(this.getTopTypebyImpact(this.optInsightsResponse, "CPU", 1), this.getTopTypebyImpact(this.optInsightsResponse, "Memory", 1), this.getTopTypebyImpact(this.optInsightsResponse, "Blocking", 1));
          }
        }
      },(error: any) => {
        this.error = error;
        this.logOptInsightsEvent(this.appInsightsResourceUri, TelemetryEventNames.AICodeOptimizerInsightsAggregatedInsightsbyTimeRangeFailure, error);
      }));
    return this._cache.get(query,request,invalidateCache);      
  }

  getTopTypebyImpact(array: any, type:string, top: number): any{
    const result = array.filter(insight => insight.type == type);
    return result
          .sort((a, b) => a.impact - b.impact)
          .slice(0,top)
          .map(insight => insight.type);
  }

  getInfoForOptInsights(appInsightsResourceId: string, appId: string, site:string, startTime: Date, endTime: Date, invalidateCache: boolean = false): Observable<any[] | null> {
    this.appInsightsResourceUri = appInsightsResourceId;
    this.site = site;
    return this.getARMToken().pipe(
      (mergeMap(aRMToken => {
      if (aRMToken === null || appInsightsResourceId === null || appId === null) return of(null);
        return this.getOAuthAccessToken(aRMToken, appInsightsResourceId).pipe(map(accessToken => {
          return accessToken;
        }), mergeMap(accessToken => {
          if (accessToken === null || appInsightsResourceId === null || appId === null) return of(null);
          return this.getAggregatedInsightsbyTimeRange(accessToken, appId, startTime, endTime, invalidateCache);
        }));
      })));
  }

  logOptInsightsEvent(resourceUri: string, telemetryEvent: string, error?:string, totalInsights?: number, site?:string){
    let webSiteService = this._resourceService as WebSitesService;
    this.resourcePlatform = webSiteService.platform;
    this.resourceAppType = webSiteService.appType;
    this.resourceSku = webSiteService.sku;
    this.startTime = this._detectorControlService.startTime;
    this.endTime = this._detectorControlService.endTime;
    const aICodeEventProperties = {
      'Site': site != undefined ? site: this.site != undefined ? this.site : "",
      'AppInsightsResourceUri': resourceUri,
      'Platform': this.resourcePlatform != undefined ? this.resourcePlatform.toString() : "",
      'AppType': this.resourceAppType != undefined ? this.resourceAppType.toString(): "",
      'ResourceSku': this.resourceSku != undefined ? this.resourceSku.toString(): "",
      'StartTime': this.startTime != undefined ? this.startTime.toString(): "",
      'EndTime': this.endTime != undefined ? this.endTime.toString(): "",
      'Error': error != undefined ? error.toString(): "",
      'TotalInsights': totalInsights != undefined ? totalInsights.toString(): ""
    };
    this.telemetryService.logEvent(telemetryEvent, aICodeEventProperties);
  }
}
