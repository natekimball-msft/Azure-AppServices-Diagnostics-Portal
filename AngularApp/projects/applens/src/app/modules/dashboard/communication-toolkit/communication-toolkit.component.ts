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
    ["File Server Issues", ["High CPU", "Noisy Neighbor / Automorphism failed to scale out FEs", "Noisy Neighbor / Single Site Stress Test", "Noisy Neighbor / Single Site Under Attack", "Unplanned Hardware", "File Server Upgrade"] ],
    ["Customer Code Issues", ["App Issue, Slow", "App issue, deadlock at .Result", "App issue, too big zip file for RUN_FROM_PACKAGE"]],
    ["Platform Issues", ["Storage Volume Caused Downtime"]],
    ["Modify/Edit Existing RCAs", []],
    ["Other", []],
    ["Health Check Issues", []]
  ]);
  
  rcaMapping : Map<string, string> = new Map([
    ["Unplanned Hardware" , "<html><head><p>The Microsoft Azure Team has investigated the issue reported and we have identified it was due to an issue within the Azure App Service storage subsystem.</p> <p>The file shares in Azure App Services are served by a collection of file servers, which mount durable cloud-based storage volumes. This design allows storage volumes to move between file servers when/if the file servers should go through a scheduled maintenance or any unplanned issues that would affect the fileserver. In order to reduce costs for customers, each file server hosts the file shares for multiple sites. In the multi-tenant production environments, these file servers may host file shares of different customers. For availability purposes we have implemented a read-only (R/O) replica of the site content for Instances to fall back on should the primary read/write (RW) volume becomes unavailable or severely impacted by latency.</p> <p>During the time of the issue, there were unplanned hardware failures which impacted the RW file server which your application was using. This caused your application to failover to use the RO replica until the platform performed an automated repair operation on the affected RW FileServer, after which you app was switched back to use its RW volume.</p> <p>The issue was resolved on 2023-02-22 04:45 UTC.</p> <p>We are continuously taking steps to improve the Azure Web App service and our processes to ensure such incidents do not occur in the future, and in this case that includes (but is not limited to):</p> <ul> <b><li>Improve storage resiliency to reduce impact during these VM impacting events</li></b> </ul> <p>We apologize for any inconvenience.</p> <p>Regards,<br>The Microsoft Azure Team<br><a href=\"https://privacy.microsoft.com/en-us/privacystatement\" target=\"_blank\">Privacy Statement</a></p> </html>"],
      [ "Noisy Neighbor / Automorphism failed to scale out FEs",     "<html><head><p>The Microsoft Azure Team has investigated the issue you reported regarding slow requests on 02/01/2023.</p><p>We have identified the issue was due to a misconfiguration of Azure Front Door health check probes by another customer sharing the same group of resources.  The increased traffic from the customer's Azure Front Door health checks increased total request per second received by the Azure App Service Front End (FE) instances by 1700%.  This resulted in multiple customers experiencing intermittent request slowness, including 503 errors.  </p><p>Under normal conditions, App Service should have detected the increased traffic and automatically increased the number of FE instances to accommodate the load.  However, the automated scaling process did not perform the scale operation, even after detecting the increased traffic.  Engineers were able to mitigate the issue by manually increasing the FE instances.</p><p>We are continuously taking steps to improve the Azure Web App service and our processes to ensure such incidents do not occur in the future, and in this case that includes (but is not limited to):</p> <ul> <b><li>Improve the automated scaling process to detect when it is stuck.</li></b><b><li>Add alerting to detect when expected scale operations do not complete.</li></b> </ul><p>We apologize for any inconvenience.</p> <p>Regards,<br>The Microsoft Azure Team<br><a href=\"https://privacy.microsoft.com/en-us/privacystatement\" target=\"_blank\">Privacy Statement</a></p> </html>"],
    ["Noisy Neighbor / Single Site Stress Test","<html><p>The Microsoft Azure Team has investigated the issue you reported regarding slow requests. We have identified the issue was due to a load test conducted by another customer sharing the same group of resources. The load test increased total request per second received by the Azure App Service Front End (FE) instances by 600%. During the load test, Azure Software Load Balancer (SLB) interpreted the load test as a Denial of Service (DoS) attack, and throttled all traffic to App Service FE instances for a period of four minutes. This resulted in multiple customers experiencing intermittent request slowness, including 503 errors.</p>  <p>After the initial throttling, Azure SLB correctly identified that the source of the load was isolated to only specific IP addresses, and subsequently throttling was applied to only the IP addresses causing the load.</p>  <p>We are continuously taking steps to improve the Azure Web App service and our processes to ensure such incidents do not occur in the future, and in this case it includes (but is not limited to):</p>  <ul><b><li>Improving Azure SLB's response to single IP source DoS attacks.</li></b> </ul>  <p>We apologize for any inconvenience.</p>  <p>Regards,<br>The Microsoft Azure Team<br><a href=\"https://privacy.microsoft.com/en-us/privacystatement\" target=\"_blank\">Privacy Statement</a></p> </html> " ],
    ["Noisy Neighbor / Single Site Under Attack", ""], 
      [ "High CPU", "<html><head><p>The Microsoft Azure Team has investigated the issue you reported involving downtime on your application with 503 status codes on 02/01/2023.</p><p>Upon investigation, engineers determined that the cause of the 503 errors was a high number of cache consistency issues on the data plane VM. These errors were linked to an influx of updates to the database during infrastructure upgrade, which were called in a manner prone to race conditions and SQL conflicts.</p> <p>We are continuously taking steps to improve the Azure Web App service and our processes to ensure such incidents do not occur in the future, and in this case that includes (but is not limited to):</p> <ul> <b><li>Re-evaluating the way we call these updates during infrastructure upgrade scenarios</li></b> <b><li>Improve detection of persistence failures to reduce time of detection and mitigation</li></b> </ul><p>We apologize for any inconvenience.</p> <p>Regards,<br>The Microsoft Azure Team<br><a href=\"https://privacy.microsoft.com/en-us/privacystatement\" target=\"_blank\">Privacy Statement</a></p></html>"],
      [ "App Issue, Slow", "customer code RCA"],
      [ "App issue, deadlock at .Result", "customer code RCA"],
      [ "App issue, too big zip file for RUN_FROM_PACKAGE", "customer code RCA"],
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
