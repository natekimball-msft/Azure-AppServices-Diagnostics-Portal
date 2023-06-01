import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, flatMap, map, mergeMap, retry, take, tap } from 'rxjs/operators';
import { ScopeAuthorizationToken } from '../../models/portal';
import { PortalService } from '../../../startup/services/portal.service';
import { CacheService } from '../cache.service';
import { OperatingSystem } from 'projects/app-service-diagnostics/src/app/shared/models/site';
import { WebSitesService } from 'projects/app-service-diagnostics/src/app/resources/web-sites/services/web-sites.service';
import { ResourceService } from 'projects/app-service-diagnostics/src/app/shared-v2/services/resource.service';
import { AppType } from 'projects/app-service-diagnostics/src/app/shared/models/portal';
import { Sku } from 'projects/app-service-diagnostics/src/app/shared/models/server-farm';
import { CodeOptimizationType, DetectorControlService, TelemetryEventNames, TelemetryService } from 'diagnostic-data';
import * as moment from 'moment';


interface IssueData {
  [issueId: string]: string;
}

@Injectable()
export class OptInsightsService {

  private readonly GATEWAY_HOST_URL: string = "https://gateway.azureserviceprofiler.net";
  private readonly OAUTH_TOKEN_API: string = "/token";
  private readonly optInsightsRole: string = 'ProfileReader';
  private readonly authEndpoint: string = "https://management.azure.com"
  private readonly timeRangeAPIVersion: string = "api-version=2023-03-19-preview"
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
  OPIResources: any = [];



  constructor(private http: HttpClient, private _portalService: PortalService, private _cache: CacheService, private telemetryService: TelemetryService, private _resourceService: ResourceService, private _detectorControlService: DetectorControlService) {
  }

  private getARMToken(): Observable<string | null> {
    const scope: ScopeAuthorizationToken = { resourceName: "profile" };
    return this._portalService.getScopedToken(scope).pipe(take(1), map(data => {
      let authData = JSON.parse(data);
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
      }, (error: any) => {
        this.error = error;
        this.logOptInsightsEvent(this.appInsightsResourceUri, TelemetryEventNames.AICodeOptimizerInsightsOAuthAccessTokenFailure, error);
      }));
  }

  getAggregatedInsightsbyTimeRange(oAuthAccessToken: string, appId: string, startTime: moment.Moment, endTime: moment.Moment, invalidateCache: boolean = false, type?: CodeOptimizationType): Observable<any[]> {
    const _startTime = startTime.clone();
    const _endTime = endTime.clone();

    const query: string = `${this.GATEWAY_HOST_URL}/api/apps/${appId}/aggregatedInsights/timeRange?${this.timeRangeAPIVersion}&startTime=${_startTime.toISOString()}&endTime=${_endTime.toISOString()}`;
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${oAuthAccessToken}`,
      'Content-Type': 'application/json'
    });
    const request = this.http.get(query, { headers: headers }).pipe(
      retry(2),
      map((aggregatedInsights: any) => {
        this.optInsightsResponse = this.parseRowsIntoTable(aggregatedInsights);
        this.logOptInsightsEvent(this.appInsightsResourceUri, TelemetryEventNames.AICodeOptimizerInsightsAggregatedInsightsbyTimeRangeSuccessful, "", aggregatedInsights.length);
        if (this.optInsightsResponse.length <= 1) {
          return this.optInsightsResponse;
        }
        else {
          if (type != undefined) {
            return this.getTopTypeByImpact(this.optInsightsResponse, type, 3);
          }
          else {
            return this.getTopTypeByImpact(this.optInsightsResponse, CodeOptimizationType.All, 3);
          }
        }
      }, (error: any) => {
        this.error = error;
        this.logOptInsightsEvent(this.appInsightsResourceUri, TelemetryEventNames.AICodeOptimizerInsightsAggregatedInsightsbyTimeRangeFailure, error);
      }));
    return this._cache.get(query, request, invalidateCache);
  }

  getOPIResources(invalidateCache: boolean): Observable<any[]> {
    const query = 'assets/OPIResources.json';
    const oPIResourcesRequest = this.http.get<any>(query).pipe(
      retry(2),
      map((oPIResources: any) => {
        return oPIResources;
      },
        (error: any) => {
          this.error = error;
          this.logOptInsightsEvent(this.appInsightsResourceUri, TelemetryEventNames.AICodeOptimizerInsightsFailureGettingOPIResources, error);
        }));
    return this._cache.get(query, oPIResourcesRequest, invalidateCache);
  }

  parseRowsIntoTable(rows: any, oPIResources: any) {
    let table: any = [];
    if (!rows || rows.length === 0) {
      return table;
    }
    rows.forEach(element => {
      table.push({
        type: element.issueCategory,
        issue: `${oPIResources[element.issueId]?.title || this.defaultStrings(element.issueCategory, element.function)}`,
        component: element.function,
        count: element.count,
        impact: `${element.value.toFixed(2)}%`,
        role: element.roleName,
      });
    });
    return table;
  }

  getIssueStrings(issueId: string): any | undefined {
    if (this.OPIResources.hasOwnProperty(issueId)) {
      return this.OPIResources[issueId];
    }
    return undefined;
  }

  defaultStrings(type: CodeOptimizationType, functionName: string): string {
    switch (type) {
      case CodeOptimizationType.CPU:
        return `${functionName} is causing high CPU usage`;
      case CodeOptimizationType.Memory:
        return `Excessive allocations due to ${functionName}`;
      case CodeOptimizationType.Blocking:
        return `Excessive thread blocking by ${functionName}`;
      default:
        return `Issue caused by ${functionName}`;
    }
  }

  getTopTypeByImpact(array: any, type: CodeOptimizationType, top: number): any {
    var result: any[];
    if (type == CodeOptimizationType.All) {
      result = array;
    }
    else {
      result = array.filter(insight => <CodeOptimizationType>insight.type == type);
    }
    if (result.length < 2) {
      return result;
    }
    else {
      return result
        .sort((a, b) => (Number(b.impact.replace("%", ""))) - (Number(a.impact.replace("%", ""))))
        .slice(0, top);
      //.map(insight => insight);
    }
  }

  // formatOpiString(str: string, contract: AggregatedInsightsContract): string {
  //   for (const key of Object.keys(contract)) {
  //     str = str.replace(`{${key}}`, contract[key]);
  //   }
  //   return str;
  // }

  getInfoForOptInsights(appInsightsResourceId: string, appId: string, site: string, startTime: moment.Moment, endTime: moment.Moment, invalidateCache: boolean = false, type?: CodeOptimizationType): Observable<any[] | null> {
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

  logOptInsightsEvent(resourceUri: string, telemetryEvent: string, error?: string, totalInsights?: number, site?: string) {
    let webSiteService = this._resourceService as WebSitesService;
    this.resourcePlatform = webSiteService.platform;
    this.resourceAppType = webSiteService.appType;
    this.resourceSku = webSiteService.sku;
    this.startTime = this._detectorControlService.startTime.toISOString();
    this.endTime = this._detectorControlService.endTime.toISOString();
    const aICodeEventProperties = {
      'Site': site != undefined ? site : this.site != undefined ? `${this.site}` : "",
      'AppInsightsResourceUri': `${resourceUri}`,
      'Platform': this.resourcePlatform != undefined ? `${this.resourcePlatform}` : "",
      'AppType': this.resourceAppType != undefined ? `${this.resourceAppType}` : "",
      'ResourceSku': this.resourceSku != undefined ? `${this.resourceSku}` : "",
      'StartTime': this.startTime != undefined ? `${this.startTime}` : "",
      'EndTime': this.endTime != undefined ? `${this.endTime}` : "",
      'Error': error != undefined ? `${error}` : "",
      'TotalInsights': totalInsights != undefined ? `${totalInsights}` : ""
    };
    this.telemetryService.logEvent(telemetryEvent, aICodeEventProperties);
  }
}
