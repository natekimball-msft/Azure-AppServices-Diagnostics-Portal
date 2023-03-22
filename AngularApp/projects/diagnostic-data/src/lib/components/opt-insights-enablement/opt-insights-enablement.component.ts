import { Component, Input, OnInit } from '@angular/core';
import { OptInsightsService } from 'projects/app-service-diagnostics/src/app/shared/services/optinsights/optinsights.service';

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

  @Input()
  resourceUri: string = "";
  appId: string = "";

  ngOnInit(): void {
    this.loading = true;
    this._optInsightsService.getInfoForOptInsights(this.resourceUri, this.appId).subscribe(res => {
      if (res && res["Tables"]) {
        let rows = res["Tables"][0]["Rows"];
        this.parseRowsIntoTable(rows);
      }
      this.loading = false;
    });
  }


  parseRowsIntoTable(rows: any) {
    if (!rows || rows.length === 0) {
      return;
    }
    rows.forEach(element => {
      this.table.push({
        key: element[0],
        insight: element[1],
        metadata: element[2],
        component: element[3],
        method: element[4],
        count: element[5],
        traceOccurrences: element[6],
        maxImpactPercent: element[7],
        maxBlockingTime: element[8],
        maxTimeStamp: element[9]
      });
    });
  }
}

