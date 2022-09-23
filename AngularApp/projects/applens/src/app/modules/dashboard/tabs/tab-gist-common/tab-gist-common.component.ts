import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { DiagnosticApiService } from 'projects/applens/src/app/shared/services/diagnostic-api.service';
import { ResourceService } from 'projects/applens/src/app/shared/services/resource.service';
import { filter } from 'rxjs/operators';
import { TabKey, Tab } from '../tab-key';

@Component({
  selector: 'tab-gist-common',
  templateUrl: './tab-gist-common.component.html',
  styleUrls: ['./tab-gist-common.component.scss']
})
export class TabGistCommonComponent implements OnInit {
  showTabs: boolean = false;
  commitHistoryEnabled: boolean = false;
  tabs: Tab[] = [
    {
      headerText: "Develop",
      itemKey: TabKey.Develop
    },
    {
      headerText: "Commit History",
      itemKey: TabKey.CommitHistory
    }
  ];
  selectedTabKey: string;
  constructor(private _router: Router, private _activatedRoute: ActivatedRoute, private _diagnosticApiService: DiagnosticApiService, private resourceService: ResourceService) { }

  ngOnInit() {
    //hide commit history
    this._diagnosticApiService.getEnableDetectorDevelopment().subscribe(enabledDetectorDevelopment => {
      this.showTabs = enabledDetectorDevelopment;
      if (this.showTabs){
        this._diagnosticApiService.getDevopsConfig(`${this.resourceService.ArmResource.provider}/${this.resourceService.ArmResource.resourceTypeName}`).subscribe(config => {
          if (config.graduationEnabled) this.showTabs = false;
        });
      }
    });
    this._router.events.pipe(filter(event => event instanceof NavigationEnd)).subscribe(e => {
      const key: string = this._activatedRoute.firstChild.snapshot.data["tabKey"];
      this.selectedTabKey = key ? key : this.tabs[0].itemKey;
    });
  }

  navigateToData(ev: any) {
    const key: string = ev.item.props.itemKey;

    switch (key) {
      case TabKey.Develop:
        this._router.navigate(["./"], {
          relativeTo: this._activatedRoute
        });
        break;
      case TabKey.CommitHistory:
        this._router.navigate(["changelist"], {
          relativeTo: this._activatedRoute
        });
        break;
    }
  }
}
