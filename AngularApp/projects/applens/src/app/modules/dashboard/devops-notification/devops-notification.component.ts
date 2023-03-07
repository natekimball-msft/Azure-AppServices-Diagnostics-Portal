import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApplensDiagnosticService } from '../services/applens-diagnostic.service';
import { IPanelProps, PanelType } from 'office-ui-fabric-react';
import { DevopsserviceService } from '../../../shared/services/devopsservice.service';
@Component({
  selector: 'devops-notification',
  templateUrl: './devops-notification.component.html',
  styleUrls: ['./devops-notification.component.scss']
})
export class DevopsNotificationComponent implements OnInit {

  response:any[] = [];
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
      height: "18px"
    }
  };
  bannerTimer:any = null;
  constructor(private _router:Router, private _diagnosticsService:ApplensDiagnosticService,private devopsService:DevopsserviceService ) { }

  ngOnInit(): void {
    let resourceId = this._diagnosticsService.resourceId;
    this.devopsService.getPendingChanges(resourceId).subscribe(res => {
      this.response = res;
    }, error => {
      this.response.concat([]);
    }, () => {
      this.generateBannerMessage(this.response);
    }); 
  }


  generateBannerMessage(result:any[]) {
    let finalCount = 0;
    if (result.length > 0 ) {   
       finalCount += result[0].length;
      for(var start = 1;start<result.length; start++) {      
        finalCount += result[start];
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
