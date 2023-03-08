import { Component, OnInit } from '@angular/core';

import { Router } from '@angular/router';
import { ApplensDiagnosticService } from '../services/applens-diagnostic.service';
import { IPanelProps, PanelType } from 'office-ui-fabric-react';
import { forkJoin } from 'rxjs';
import { AdalService } from 'adal-angular4';
import { ResourceDescriptor } from 'diagnostic-data';
import { DevopsConfig } from '../../../shared/models/devopsConfig';

@Component({
  selector: 'devops-notification',
  templateUrl: './devops-notification.component.html',
  styleUrls: ['./devops-notification.component.scss']
})
export class DevopsNotificationComponent implements OnInit {

  currentDevopsConfig: DevopsConfig;
  userId:string = "";
  response:any[] = [];
  resourceId: string = "";
  showDevopsStatusMessage: boolean = false;
  PanelType = PanelType;
  devopsPanelStyles:  IPanelProps["styles"] = {
    root: {
      height: "100px",
    },
    content: {
      padding: "0px"
    },
    navigation: {
      height: "20px"
    }
  };
  bannerTimer:any = null;
  constructor(private _router:Router, private _adalService: AdalService, private _diagnosticsService:ApplensDiagnosticService) { }

  ngOnInit(): void {
    this.resourceId = this._diagnosticsService.resourceId;
    let alias = Object.keys(this._adalService.userInfo.profile).length > 0 ? this._adalService.userInfo.profile.upn : '';
    this.userId = alias.replace('@microsoft.com', '');
    // fetch all commits on the path.
    let provider = ResourceDescriptor.parseResourceUri(this.resourceId).provider;
    let type = ResourceDescriptor.parseResourceUri(this.resourceId).type;
    this._diagnosticsService.getDevopsChangeList("/", this.resourceId).subscribe((data: any[]) => {
      let recentCommits = data.slice(0, 10);
      let commitObservable = [];
      let activePRObservable = this._diagnosticsService.getDevopsPullRequest(`${provider}/${type}`);
      commitObservable.push(activePRObservable);
      recentCommits.forEach(version => {
        commitObservable.push(this._diagnosticsService.getDevopsCommitStatus(version["commitId"], this.resourceId));
      });


      forkJoin(commitObservable).subscribe((res: any[]) => {
        this.response = res;
      }, error => {
        this.response.concat([]);
      }, () => {
        this.generateBannerMessage(this.response);
      });  
      });  
  }

  generateBannerMessage(result:any[]) {
    let finalCount = 0;
    if (result.length > 0 ) {   
       finalCount += result[0].length;
      for(var start = 1;start<result.length; start++) {      
        finalCount += result[start].length;
      }
    }
    if( finalCount > 0) {
      this.showDevopsStatusMessage =  true;
    } else {
      this.showDevopsStatusMessage = false;
    }
  }


  goToPendingDeployments() {
      this._router.navigateByUrl(`${this._diagnosticsService.resourceId}/deployments`);
  }

  closeNotification() {
    this.showDevopsStatusMessage = false;
  }

  onOpenNotification() {
    this.bannerTimer = setTimeout(() => {
      this.closeNotification();
    }, 10000);
  }


}
