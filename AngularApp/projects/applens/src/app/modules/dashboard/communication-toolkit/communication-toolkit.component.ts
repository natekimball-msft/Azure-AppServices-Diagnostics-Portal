import { Component, OnInit } from '@angular/core';
import { SpinnerSize } from 'office-ui-fabric-react';
import { delay } from 'rxjs-compat/operator/delay';

@Component({
  selector: 'communication-toolkit',
  templateUrl: './communication-toolkit.component.html',
  styleUrls: ['./communication-toolkit.component.scss']
})

export class CommunicationToolkitComponent implements OnInit {


  rcaLoading = false; 
  rcaDisplayed = false; 
  loadingSize = SpinnerSize.large; 
  currentSelectedRCATopic : string = ""; 
  currentSelectedRCA : string = ""; 
  subcategoriesDisplayed = false; 
  otherDisplayed = false; 
  otherDisplayText = "We do not currently offer RCA templates for other issues at this time, but are looking to expand to offer these in the future. \nPlease\
  add a description of the issue you would like us to create a template for, and will accommodate this for the future. "; 

  categoryMapping : Map<string, any> = new Map([
    ["File Server Issues", ["High CPU", "Noisy Neighbor", "Unplanned Hardware", "File Server Upgrade"] ],
    ["Customer Code Issues", ["App Issue, Slow", "App issue, deadlock at .Result", "App issue, too big zip file for RUN_FROM_PACKAGE"]],
    ["Platform Issues", ["Storage Volume Caused Downtime"]],
    ["Modify/Edit Existing RCAs", []],
    ["Other", []],
    ["Health Check Issues", []]
  ]);
  
  rcaMapping : Map<string, string> = new Map([
    ["Unplanned Hardware" , "The Microsoft Azure Team has investigated the issue reported and we have identified it was due to an issue within the Azure App Service storage subsystem.\
    \nThe file shares in Azure App Services are served by a collection of file servers,\
     which mount durable cloud-based storage volumes.  \
     This design allows storage volumes to move between file servers when/if the file servers should go \
     through a scheduled maintenance or any unplanned issues that would affect the fileserver. \
     In order to reduce costs for customers, each file server hosts the file shares for multiple sites.\
      In the multi-tenant production environments, these file servers may host file shares of \
      different customers. For availability purposes we have implemented a read-only (R/O)\
       replica of the site content for Instances to fall back on should the primary \
       read/write (RW) volume becomes unavailable or severely impacted by latency. \n \
       During the time of the issue, there were unplanned hardware failures which impacted the RW \
        file server which your application was using. This caused your application to failover to use the \
        RO replica until the platform performed an automated repair operation on the affected RW FileServer, \
        after which you app was switched back to use its RW volume. \
        The issue was resolved on 2023-02-22 04:45 UTC.\n We are continuously taking steps to improve the\
         Azure Web App service and our processes to ensure such incidents do not occur in the future, and \
         in this case that includes (but is not limited to): Improve storage resiliency to reduce impact \
         during these VM impacting events\n We apologize for any inconvenience.\nRegards,\
         The Microsoft Azure Team\n \
         Privacy Statement\n"],
      [ "Noisy Neighbor", "noisy neighbor RCA"],
      [ "High CPU", "high cpu rca"],
      [ "Customer Code Issues", "customer code RCA"],
      ["Platform Issues", "platform issues RCA"],
      ["Health Check Issues", "health check rca"],
      ["Other", ""]
        ]);

    categoryMappingKeys = Array.from(this.categoryMapping.keys()); 
    
  
  constructor() { 
    
  }

  ngOnInit(): void {
  }

  mainCategoryClicked(rcaTopic : string) : void {

    debugger; 
    this.currentSelectedRCATopic = rcaTopic;

    if(rcaTopic == "Other"){
      this.otherClicked(); 
      return; 
    }

    else if(rcaTopic == "Modify/Edit Existing RCAs"){

      return; 
    }

    //show subcategories if subcategories not empty 
    else if(this.categoryMapping.get(this.currentSelectedRCATopic).length != 0 ){
      
      this.showRCASubCategories(); 

    }
    //otherwise show RCA 
    else{
      this.rcaLoading = true; 
      setTimeout(() => {
        this.showRCA()
        
     }, 3000);
    }
    
  }

  //show subcategories 
  showRCASubCategories(){

    this.subcategoriesDisplayed = true; 
    debugger; 

  }

  subCategoryClicked(rcaTopic : string){
    this.rcaLoading = true; 
    this.currentSelectedRCATopic = rcaTopic; 
    setTimeout(() => {
      this.showRCA()
      
   }, 3000);

  }
  

  showRCA(): void{
    this.rcaLoading = false; 
    this.subcategoriesDisplayed = false; 
    //this.currentSelectedRCATopic = "Unplanned Hardware";    
    this.currentSelectedRCA = this.rcaMapping.get(this.currentSelectedRCATopic); 
    this.rcaDisplayed = true; 
  }

  otherClicked(): void {

    this.otherDisplayed = true; 

  }

  modifierClicked(): void {

  }


}
