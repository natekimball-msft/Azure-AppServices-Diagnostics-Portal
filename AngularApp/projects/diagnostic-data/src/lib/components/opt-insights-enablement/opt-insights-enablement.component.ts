import { Component, Input, OnInit } from '@angular/core';
import { OptInsightsResource } from 'projects/app-service-diagnostics/src/app/shared/models/optinsights';
import { OptInsightsService } from 'projects/app-service-diagnostics/src/app/shared/services/optinsights/optinsights.service';
import { PortalActionService } from 'projects/app-service-diagnostics/src/app/shared/services/portal-action.service';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, mergeMap } from 'rxjs/operators';

@Component({
  selector: 'opt-insights-enablement',
  templateUrl: './opt-insights-enablement.component.html',
  styleUrls: ['./opt-insights-enablement.component.scss']
})
export class OptInsightsEnablementComponent implements OnInit {

  constructor(private _optInsightsService: OptInsightsService, private portalActionService: PortalActionService) { }

  table: any = [];
  //columnOptions: TableColumnOption[] = [];
  //columns: DataTableResponseColumn[];
  descriptionColumnName: string = "";
  allowColumnSearch: boolean = false;
  tableHeight: string = "";
  tableDescription: string = "";
  searchPlaceholder: string = "";
  loading: boolean;
  aRMToken: string = "";
  aRMTokenSubject = new BehaviorSubject<string>("");
  appInsightsResourceUri: string = "";

  @Input() resourceUri: Observable<string>;
  @Input() appId: Observable<string>;

  ngOnInit(): void {
    this.loading = true;
    this.resourceUri.subscribe(resourceUri => {
      this.appId.subscribe(appId => {
        if (resourceUri !== null && appId !== null) {
          this.appInsightsResourceUri = resourceUri;
          this._optInsightsService.getInfoForOptInsights(this.aRMToken, resourceUri, appId).subscribe(res => {
            if (res) {
              this.parseRowsIntoTable(res);
            }
            this.loading = false;
          });
        }
        else {
          this.loading = false;
        }
      })
    });
  }

  parseRowsIntoTable(rows: any) {
    if (!rows || rows.length === 0) {
      return;
    }
    let rowsCounter = 0;
    rows.forEach(element => {
      if (rowsCounter === 3) {
        return;
      }
      else {
        rowsCounter++;
        this.table.push({
          type: element.insight.type,
          issue: `${element.insight.method} is causing high ${element.insight.type}`,
          component: element.insight.component,
          count: element.count,
          impact: `${element.insight.impactPercent.toFixed(2)}%`,
          role: element.insight.roleName,
        });
      }
    });
  }

  public openOptInsightsBlade() {
    let optInsightsResource: OptInsightsResource = this.parseOptInsightsResource(this.appInsightsResourceUri, 0, 'microsoft.insights/components', false);
    this.portalActionService.openOptInsightsBlade(optInsightsResource);
  }

  parseOptInsightsResource(resourceUri: string, linkedApplicationType: number, resourceType: string, isAzureFirst: boolean): OptInsightsResource {

    var output: OptInsightsResource = {
      SubscriptionId: '',
      ResourceGroup: '',
      Name: '',
      LinkedApplicationType: linkedApplicationType,
      ResourceId: resourceUri,
      ResourceType: resourceType,
      IsAzureFirst: isAzureFirst
    };

    if (!resourceUri) {
      return output;
    }

    const resourceUriParts = resourceUri.toLowerCase().split('/');

    const subscriptionIndex = resourceUriParts.indexOf('subscriptions');
    if (subscriptionIndex > -1) {
      output.SubscriptionId = resourceUriParts[subscriptionIndex + 1];
    }

    const resourceGroupIndex = resourceUriParts.indexOf('resourcegroups');
    if (resourceGroupIndex > -1) {
      output.ResourceGroup = resourceUriParts[resourceGroupIndex + 1];
    }

    const nameIndex = resourceUriParts.indexOf('components');
    if (nameIndex > -1) {
      output.Name = resourceUriParts[nameIndex + 1];
    }


    
    return output;
  }
}

