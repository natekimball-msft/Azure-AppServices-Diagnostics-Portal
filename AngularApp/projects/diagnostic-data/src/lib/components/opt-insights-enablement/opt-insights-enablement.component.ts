import { Component, Input, OnInit } from '@angular/core';
import { ResourceType, StartupInfo } from 'projects/app-service-diagnostics/src/app/shared/models/portal';
//import { AppInsightsService } from 'projects/app-service-diagnostics/src/app/shared/services/appinsights/appinsights.service';
import { OptInsightsService } from 'projects/app-service-diagnostics/src/app/shared/services/optinsights/optinsights.service';
import { AuthService } from 'projects/app-service-diagnostics/src/app/startup/services/auth.service';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, mergeMap } from 'rxjs/operators';

@Component({
  selector: 'opt-insights-enablement',
  templateUrl: './opt-insights-enablement.component.html',
  styleUrls: ['./opt-insights-enablement.component.scss']
})
export class OptInsightsEnablementComponent implements OnInit {

  constructor(private _optInsightsService: OptInsightsService) { }

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

  @Input() resourceUri: Observable<string>;
  @Input() appId: Observable<string>;

  ngOnInit(): void {
    this.loading = true;
    this.resourceUri.subscribe(resourceUri => {
      this.appId.subscribe(appId => {
        if (resourceUri !== null && appId !== null) {
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
    rows.forEach(element => {
      this.table.push({
        type: element.insight.type,
        issue: `${element.insight.method} is causing high ${element.insight.type}`,
        component: element.insight.component,
        count: element.count,
        impact: `${element.insight.impactPercent.toFixed(2)}%`,
        role: element.insight.roleName,
      });
    });
  }
}

