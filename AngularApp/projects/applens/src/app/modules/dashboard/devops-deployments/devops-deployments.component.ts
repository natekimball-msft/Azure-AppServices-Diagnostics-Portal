import { Component, Input, OnInit } from '@angular/core';
import { DevopsConfig } from '../../../shared/models/devopsConfig';
import { ApplensDiagnosticService } from '../services/applens-diagnostic.service';
import { CommitStatus, DevOpsState } from '../../../shared/models/devopsCommitStatus';
import { forkJoin, Observable } from 'rxjs';
import { DataTableResponseColumn, DataTableResponseObject, TableColumnOption, TableFilterSelectionOption } from 'diagnostic-data';
import { MessageBarType } from 'office-ui-fabric-react';
import { Router } from '@angular/router';

@Component({
  selector: 'devops-deployments',
  templateUrl: './devops-deployments.component.html',
  styleUrls: ['./devops-deployments.component.scss']
})
export class DevopsDeploymentsComponent implements OnInit {
  currentDevopsConfig: DevopsConfig;
  DevopsStatus:CommitStatus[] = [];
  bannerMessage:string = '';
  table: DataTableResponseObject = null;
  loadingTable: boolean = false;
  columnOptions: TableColumnOption[] = [
    {
        name: "State",
        selectionOption: TableFilterSelectionOption.Multiple
    }
  ];

  notificationStatusType: MessageBarType = MessageBarType.warning;
  @Input() showDevopsStatusMessage: boolean = false;
  constructor(private _diagnosticsService:ApplensDiagnosticService, private _router:Router) { }

  ngOnInit(): void {
   
    this.loadingTable = true;
    let resourceId = this._diagnosticsService.resourceId;
    // fetch all commits on the path.
    this._diagnosticsService.getDevopsChangeList("/", resourceId).subscribe((data: any[]) => {
      let recentCommits = data.slice(0, 10);
      let commitObservable = [];
      recentCommits.forEach(version => {
        commitObservable.push(this._diagnosticsService.getDevopsCommitStatus(version["commitId"], resourceId));
      });  
      forkJoin(commitObservable).subscribe((res: CommitStatus[]) => {
        this.DevopsStatus = this.DevopsStatus.concat(res);
      }, error => {
        this.DevopsStatus.concat([]);
        this.loadingTable = false;
      }, () => {
        this.generateBannerMessage([].concat(...this.DevopsStatus));
        this.loadingTable = false;
      });          
      });            
  }

  private generateBannerMessage(devopsStatuses: CommitStatus[]) {
    let PendingOrFailed = devopsStatuses.filter(s => s.state != DevOpsState.Succeeded);
    this.table = this.generateTable(PendingOrFailed);
    if (PendingOrFailed.length > 0) {
      this.bannerMessage = 'One or more deployments have not completed. Detectors changes will not be reflected until they are completed.';
    } else {
      this.bannerMessage = '';
    }
  }
  private generateTable(pendingOrFailed: CommitStatus[]) {
    const columns: DataTableResponseColumn[] = [
      { columnName: "Release URL" },
      { columnName: "State" }
  ];
    let rows: any[][] = [];
    rows = pendingOrFailed.map(status => {
      const name =
      `<markdown>
          <a href="${status.targetUrl}">${status.description}</a>
      </markdown>`;
      return [name, DevOpsState[status.state]];
    });
    const dataTableObject: DataTableResponseObject = {
      columns: columns,
      rows: rows
  }

    return dataTableObject;
  }

  goToPendingDeployments() {
      this._router.navigateByUrl(`${this._diagnosticsService.resourceId}/deployments`);
  }
  
}
