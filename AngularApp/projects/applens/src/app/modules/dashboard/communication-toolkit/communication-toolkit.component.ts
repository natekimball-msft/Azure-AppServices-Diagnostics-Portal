import { Component, OnInit } from '@angular/core';
import { SpinnerSize } from 'office-ui-fabric-react';
import { delay } from 'rxjs-compat/operator/delay';
import { ApplensOpenAIChatService } from '../../../shared/services/applens-openai-chat.service';
import { ActivatedRoute, Router } from '@angular/router';
import { AdalService } from 'adal-angular4';
import { TelemetryService, ChatUIContextService, TelemetryEventNames } from 'diagnostic-data';
import { DiagnosticApiService } from '../../../shared/services/diagnostic-api.service';
import { ResourceService } from '../../../shared/services/resource.service';
import { UserSettingService } from '../services/user-setting.service';
import { UserChatGPTSetting } from '../../../shared/models/user-setting';
import { ClipboardService } from 'projects/diagnostic-data/src/lib/services/clipboard.service';

@Component({
  selector: 'communication-toolkit',
  templateUrl: './communication-toolkit.component.html',
  styleUrls: ['./communication-toolkit.component.scss']
})

export class CommunicationToolkitComponent implements OnInit {

  
  userPhotoSource: string = '';
  userNameInitial: string = '';
  chatHeader: string = `<h1 class='chatui-header-text'><b>SUPER</b>EasyRCA!</h1>`;

  
  // Variables to be passed down to the OpenAI Chat component
  chatComponentIdentifier: string = "EasyRCAChatGPT";
  showContentDisclaimer: boolean = true;
  contentDisclaimerMessage: string = "* Please do not send any sensitive data in your queries. Please VERIFY the given RCA before sending to customers...I'm still learning :)";

  userAlias: string = '';
  userChatGPTSetting: UserChatGPTSetting;
  
  // Variables that can be taken as input
  dailyMessageQuota: number = 20;
  messageQuotaWarningThreshold: number = 10;
  
  originalResourceProvider: string;
  currentResourceProvider: string;
  customInitialPrompt: string = "You are an AI assistant that helps customer support engineers write their RCA's for Microsoft Azure Team. RCA's stand for Root Cause Analysis. \n\nA good RCA follows the below rules:\nThe tone is convincing and apologetic, respectful towards the customer. It is informational and thorough without revealing any private and internal information. The RCA is concise. The RCA starts with explaining the issue, providing the timestamp and duration of the issue. It then describes how the issue was mitigated and resolved, and provides resolution steps and future best practices to prevent this issue from occurring in the future. The RCA ends with apologizing for the inconvenience and stating that Microsoft Azure Team is always happy to help the customer. \n\n Here is the first example of a well-written RCA: <html><head><p>The Microsoft Azure Team has investigated the issue reported and we have identified it was due to an issue within the Azure App Service storage subsystem.</p> <p>The file shares in Azure App Services are served by a collection of file servers, which mount durable cloud-based storage volumes. This design allows storage volumes to move between file servers when/if the file servers should go through a scheduled maintenance or any unplanned issues that would affect the fileserver. In order to reduce costs for customers, each file server hosts the file shares for multiple sites. In the multi-tenant production environments, these file servers may host file shares of different customers. For availability purposes we have implemented a read-only (R/O) replica of the site content for Instances to fall back on should the primary read/write (RW) volume becomes unavailable or severely impacted by latency.</p> <p>During the time of the issue, there were unplanned hardware failures which impacted the RW file server which your application was using. This caused your application to failover to use the RO replica until the platform performed an automated repair operation on the affected RW FileServer, after which you app was switched back to use its RW volume.</p> <p>The issue was resolved on 2023-02-22 04:45 UTC.</p> <p>We are continuously taking steps to improve the Azure Web App service and our processes to ensure such incidents do not occur in the future, and in this case that includes (but is not limited to):</p> <ul> <b><li>Improve storage resiliency to reduce impact during these VM impacting events</li></b> </ul> <p>We apologize for any inconvenience.</p> <p>Regards,<br>The Microsoft Azure Team<br><a href=\"https://privacy.microsoft.com/en-us/privacystatement\" target=\"_blank\">Privacy Statement</a></p> </html> \n\nHere is another example of a well-written RCA: <html><head><p>The Microsoft Azure Team has investigated an issue you encountered in which your app was not allocated a new instance when Health Check Feature was reporting errors. The issue was resolved on 2023-02-22 04:45 UTC.</p> <p>Engineers have investigated and found that in addition to instance replacement limit per app service plan, Health Check Feature cannot replace instances after a certain threshold is reached at a scale unit level (in a region). Unfortunately, the scale unit where your application is running reached that instance replacement threshold limit by Health Check Feature.</p><p>We are continuously taking steps to improve the Azure Web App service and our processes to ensure such incidents do not occur in the future, and in this case it includes (but is not limited to):</p> <ul> <b><li>Exploring options to increase this limit per scale unit.</li></b> <b><li>Improving the Health Check Feature instance replacement logic.</li></b><b><li>Improving documentation.</li></b></ul> <p>We apologize for any inconvenience.</p> <p>Regards,<br>The Microsoft Azure Team<br><a href=\"https://privacy.microsoft.com/en-us/privacystatement\" target=\"_blank\">Privacy Statement</a></p> </body> </html>\n\n The improvement steps should be bolded list items in html. Always end with a hyperlink to the Privacy Statement and make sure the RCA is in html format";
  customFirstMessageEdit: string = ""; 
  //rule : always end the rca's with privacy statement link is: 
  //always write rca's in markdown 

  // Component's internal variables
  isEnabled: boolean = false;
  isEnabledChecked: boolean = false;
  displayLoader: boolean = false;
  chatgptSearchText: string = "";

  modifierDisplayed = false; 
  rcaLoading = false; 
  rcaDisplayed = false; 
  loadingSize = SpinnerSize.large; 
  currentSelectedRCATopic : string = ""; 
  currentSelectedRCA : string = ""; 
  //subcategoriesDisplayed = false; 
  otherDisplayed = false; 
  mainCategoriesDisplayed = true; 

  copyButtonMessage : string = "Copy"; 

  // previousState : Map<string, any> = new Map([

  // ]); 
  // currentState : Map<string, any> = new Map([

  // ]); 

  otherDisplayText = "We do not currently offer RCA templates for other issues at this time, but are looking to expand to offer these in the future. \nPlease\
  add a description of the issue you would like us to create a template for and/or any feedback that you have and we will take this into consideration for the future. "; 

  mainCategoryPageText = "This toolkit is the one-stop-shop to easily find ready-to-go RCA templates for your ICMs! \n \
  You can get started by clicking on one of the categories below:";

  categoryMapping : Map<string, any> = new Map([
    ["File Server Issues", ["High CPU", "Noisy Neighbor / Automorphism failed to scale out FEs", "Noisy Neighbor / Single Site Stress Test", "Noisy Neighbor / Single Site Under Attack", "Unplanned Hardware", "File Server Upgrade"] ],
    ["Customer Code Issues", ["App Issue, Slow", "App issue, deadlock at .Result", "App issue, too big zip file for RUN_FROM_PACKAGE"]],
    ["Platform Issues", ["Storage Volume Caused Downtime"]],
    ["Health Check Issues", []],
    ["Build/Edit an RCA with <b>ChatGPT!</b>", []],
    ["Other", []]
  ]);
  
  rcaMapping : Map<string, string> = new Map([
    [" File Server: Unplanned Hardware" , "<html><head><p>The Microsoft Azure Team has investigated the issue reported and we have identified it was due to an issue within the Azure App Service storage subsystem.</p> <p>The file shares in Azure App Services are served by a collection of file servers, which mount durable cloud-based storage volumes. This design allows storage volumes to move between file servers when/if the file servers should go through a scheduled maintenance or any unplanned issues that would affect the fileserver. In order to reduce costs for customers, each file server hosts the file shares for multiple sites. In the multi-tenant production environments, these file servers may host file shares of different customers. For availability purposes we have implemented a read-only (R/O) replica of the site content for Instances to fall back on should the primary read/write (RW) volume becomes unavailable or severely impacted by latency.</p> <p>During the time of the issue, there were unplanned hardware failures which impacted the RW file server which your application was using. This caused your application to failover to use the RO replica until the platform performed an automated repair operation on the affected RW FileServer, after which you app was switched back to use its RW volume.</p> <p>The issue was resolved on 2023-02-22 04:45 UTC.</p> <p>We are continuously taking steps to improve the Azure Web App service and our processes to ensure such incidents do not occur in the future, and in this case that includes (but is not limited to):</p> <ul> <b><li>Improve storage resiliency to reduce impact during these VM impacting events</li></b> </ul> <p>We apologize for any inconvenience.</p> <p>Regards,<br>The Microsoft Azure Team<br><a href=\"https://privacy.microsoft.com/en-us/privacystatement\" target=\"_blank\">Privacy Statement</a></p> </html>"],
      [ "File Server: Noisy Neighbor / Automorphism failed to scale out FEs",     "<html><head><p>The Microsoft Azure Team has investigated the issue you reported regarding slow requests on 02/01/2023.</p><p>We have identified the issue was due to a misconfiguration of Azure Front Door health check probes by another customer sharing the same group of resources.  The increased traffic from the customer's Azure Front Door health checks increased total request per second received by the Azure App Service Front End (FE) instances by 1700%.  This resulted in multiple customers experiencing intermittent request slowness, including 503 errors.  </p><p>Under normal conditions, App Service should have detected the increased traffic and automatically increased the number of FE instances to accommodate the load.  However, the automated scaling process did not perform the scale operation, even after detecting the increased traffic.  Engineers were able to mitigate the issue by manually increasing the FE instances.</p><p>We are continuously taking steps to improve the Azure Web App service and our processes to ensure such incidents do not occur in the future, and in this case that includes (but is not limited to):</p> <ul> <b><li>Improve the automated scaling process to detect when it is stuck.</li></b><b><li>Add alerting to detect when expected scale operations do not complete.</li></b> </ul><p>We apologize for any inconvenience.</p> <p>Regards,<br>The Microsoft Azure Team<br><a href=\"https://privacy.microsoft.com/en-us/privacystatement\" target=\"_blank\">Privacy Statement</a></p> </html>"],
    ["File Server: Noisy Neighbor / Single Site Stress Test","<html><p>The Microsoft Azure Team has investigated the issue you reported regarding slow requests. We have identified the issue was due to a load test conducted by another customer sharing the same group of resources. The load test increased total request per second received by the Azure App Service Front End (FE) instances by 600%. During the load test, Azure Software Load Balancer (SLB) interpreted the load test as a Denial of Service (DoS) attack, and throttled all traffic to App Service FE instances for a period of four minutes. This resulted in multiple customers experiencing intermittent request slowness, including 503 errors.</p>  <p>After the initial throttling, Azure SLB correctly identified that the source of the load was isolated to only specific IP addresses, and subsequently throttling was applied to only the IP addresses causing the load.</p>  <p>We are continuously taking steps to improve the Azure Web App service and our processes to ensure such incidents do not occur in the future, and in this case it includes (but is not limited to):</p>  <ul><b><li>Improving Azure SLB's response to single IP source DoS attacks.</li></b> </ul>  <p>We apologize for any inconvenience.</p>  <p>Regards,<br>The Microsoft Azure Team<br><a href=\"https://privacy.microsoft.com/en-us/privacystatement\" target=\"_blank\">Privacy Statement</a></p> </html> " ],
    ["File Server: Noisy Neighbor / Single Site Under Attack", "<html><head><p>The Microsoft Azure Team has investigated the issue you reported regarding slow requests. The issue was resolved on 2023-02-22 04:45 UTC.</p> <p>We have identified the issue was due to excessive load on an app owned by another customer sharing the same group of resources. The load caused high sustained CPU utilization on the Azure App Service Front End (FE) instances, leading to occasional slow request responses.  </p> <p>After we identified the app with the excessive load, we redirected the traffic to a secondary pool of Front End instances, mitigating the impact on other customers on the same scale unit. </p><p>We are continuously taking steps to improve the Azure Web App service and our processes to ensure such incidents do not occur in the future, and in this case it includes (but is not limited to):</p> <ul> <b><li>Improving alerting and mitigation procedures</li></b> </ul> <p>We apologize for any inconvenience.</p> <p>Regards,<br>The Microsoft Azure Team<br><a href=\"https://privacy.microsoft.com/en-us/privacystatement\" target=\"_blank\">Privacy Statement</a></p> </body> </html>"], 
      [ "File Server: High CPU", "<html><head><p>The Microsoft Azure Team has investigated the issue you reported involving downtime on your application with 503 status codes on 02/01/2023.</p><p>Upon investigation, engineers determined that the cause of the 503 errors was a high number of cache consistency issues on the data plane VM. These errors were linked to an influx of updates to the database during infrastructure upgrade, which were called in a manner prone to race conditions and SQL conflicts.</p> <p>We are continuously taking steps to improve the Azure Web App service and our processes to ensure such incidents do not occur in the future, and in this case that includes (but is not limited to):</p> <ul> <b><li>Re-evaluating the way we call these updates during infrastructure upgrade scenarios</li></b> <b><li>Improve detection of persistence failures to reduce time of detection and mitigation</li></b> </ul><p>We apologize for any inconvenience.</p> <p>Regards,<br>The Microsoft Azure Team<br><a href=\"https://privacy.microsoft.com/en-us/privacystatement\" target=\"_blank\">Privacy Statement</a></p></html>"],
      ["File Server Upgrade", "<html><head><p>The Microsoft Azure Team has investigated the issue you reported where you experienced HTTP 500 errors. This issue was found to be related to the platform upgrade we executed.</p> <p>Upon further investigation, engineers discovered that it was caused by the file servers being upgraded which were hosting your app's contents. There are two file servers for your ASE and they were upgraded starting from 2020-09-07 09:26 UTC and 2020-09-07 10:30 UTC. Since one of them needs to mount the volume of your folder, the volume moved twice during the time range. Unfortunately this is our current limitation.</p><p>In order to avoid any future downtime caused by upgrades, we would suggest to consider creating another app in a new app service plan in a different region, deploying the same code to it, and setting up either Traffic Manager or Azure Front Door.</p><p>We are continuously taking steps to improve the Microsoft Azure App Service and our platform maintenance processes. However, as a PaaS, security releases will always be evaluated and may be fast tracked based on the level of critically. The below article may help if you would like to evaluate the features of different offerings that would allow you more control.</p><p><a href = \"https://docs.microsoft.com/en-us/azure/app-service-web/choose-web-site-cloud-service-vm\" target=\"_blank\">https://docs.microsoft.com/en-us/azure/app-service-web/choose-web-site-cloud-service-vm</a></p><p>We apologize for any inconvenience.</p> <p>Regards,<br>The Microsoft Azure Team<br><a href=\"https://privacy.microsoft.com/en-us/privacystatement\" target=\"_blank\">Privacy Statement</a></p> </body> </html>"],
      [ "Customer Code: App Issue, Slow", "<html><head><p>The Microsoft Azure Team has investigated the issue you reported on the sudden slow responses happened with your app for 50 minutes.</p> <p>Your app started to experience slowness from 1/27/2020 08:20 UTC. We initially thought it could be due to the platform upgrade we performed, but it completely finished 2 hours before the issue occurred. Due to the time apart, we cannot correlate your issue with the upgrade operation.</p> <p>We then checked where the slowness was happening and found that all the CPU times have been spent within your app's process. This means your application was taking long time to serve incoming requests for some reason, maybe due to depending external services like SQL database. This caused the drop of accepted incoming requests until 1/27/2020 09:10 UTC.</p> <p>Since we don't own your code, we were unable to further investigate to identify which code portion was causing the issue. As next steps, we would suggest to consider using profiling tools, taking dumps and engage with the support team so our engineers can investigate.</p><p>We apologize for the length of time it took to get you the summary of this RCA. We also want to thank you for patiently working with us, as the time spent on this issue resulted in improvements within our service that will benefit all customers. </p> <p>We apologize for any inconvenience.</p> <p>Regards,<br>The Microsoft Azure Team<br><a href=\"https://privacy.microsoft.com/en-us/privacystatement\" target=\"_blank\">Privacy Statement</a></p> </body> </html>"],
      [ "Customer Code: App issue, deadlock at .Result", "<html><head><p>The Microsoft Azure Team has investigated the issue you reported on your app being unhealthy and returned 502 errors for 90 minutes on 8/18/2021.</p> <p>We started our investigation from your Application Gateway instance but could not find anything wrong. Then we investigated your web app and noticed that your app was stuck within your code. Further investigation revealed that your app code was in deadlock state because get_Result() was called for a Task that was invoked asynchronously. It is a widely known problem that mixing synchronous and asynchronous calls can lead to deadlocks.</p> <p>As we have suggested, the best course of action is to fix the app code by changing all the synchronous method calls to asynchronous. We have also advised to use Diagnose and Solve from Azure portal which shows the exact stack traces to quickly troubleshoot such an issue.</p> <p>We apologize for the length of time it took to get you the summary of this RCA. We also want to thank you for patiently working with us, as the time spent on this issue resulted in improvements within our service that will benefit all customers.</p><p>Regards,<br>The Microsoft Azure Team<br><a href=\"https://privacy.microsoft.com/en-us/privacystatement\" target=\"_blank\">Privacy Statement</a></p> </body> </html>"],
      [ "Customer Code: App issue, too big zip file for RUN_FROM_PACKAGE", "<html><head><p>The Microsoft Azure Team has investigated the issue you reported on the 503 errors your app is experiencing. This issue was found to be related to the Run From Package feature your app was using. Upon investigation, engineers discovered that your ZIP file was too large (1.2GB) to load to workers. Since downloading the ZIP file took too long, the startup sequence timed out and ended up with 503 status code. </p> <p>One solution would be that you deploy your code with a different deployment method (e.g. Azure DevOps) instead of Run From Package. Another solution would be to separate your project into multiple subprojects and deploy them to different apps.</p><p>We are continuously taking steps to improve the Azure Web App service and our processes to ensure such incidents do not occur in the future, and in this case it includes (but is not limited to):</p> <ul> <b><li> Improving the error logs as well as diagnostic tools for this type of error to allow to easily find the problem</li></b> <b><li>Improving the Health Check Feature instance replacement logic.</li></b><b><li>Adding more test cases to cover such cases.</li></b></ul> <p>We apologize for any inconvenience.</p> <p>Regards,<br>The Microsoft Azure Team<br><a href=\"https://privacy.microsoft.com/en-us/privacystatement\" target=\"_blank\">Privacy Statement</a></p> </body> </html>"],
      ["Platform Issue: Storage Volume Caused Downtime", "<html><head><p>The Microsoft Azure Team has investigated the issue reported regarding the HTTP 500 level errors that your app experienced.</p> <p>On 04/06/2023, App Service rolled out a configuration change to our scale units in East US and North Central US. The config change was part of our platform upgrade and was performed to enhanced reliability and security on our scale units.<br>Unfortunately on a subset of our scale units, this change impacted the ability of the front ends to access the storage subsystem. As a result, your app might have experienced read/write access failures to files.Unfortunately on a subset of our scale units, this change impacted the ability of the front ends to access the storage subsystem. As a result, your app might have experienced read/write access failures to files.</p> <p>The issue was automatically detected and the upgrade was immediately paused. To mitigate the issue, engineers  reverted the config change on all the impacted scale units. Additionally, we have have setup verification to ensure that all the impacted apps are mitigated.</p> <p>We are continuously taking steps to improve the Azure Web App service and our processes to ensure such incidents do not occur in the future, and in this case that includes (but is not limited to):</p> <ul> <b><li>Enhanced monitoring and notification of instability in the storage subsystem</li></b> <b><li>Enhanced testing to ensure any potential issues with config change roll our are identified early</li></b> </ul> <p>We apologize for any inconvenience.</p> <p>Regards,<br>The Microsoft Azure Team<br><a href=\"https://privacy.microsoft.com/en-us/privacystatement\" target=\"_blank\">Privacy Statement</a></p> </body> </html>"],
      ["Health Check Issues", "<html><head><p>The Microsoft Azure Team has investigated an issue you encountered in which your app was not allocated a new instance when Health Check Feature was reporting errors. The issue was resolved on 2023-02-22 04:45 UTC.</p> <p>Engineers have investigated and found that in addition to instance replacement limit per app service plan, Health Check Feature cannot replace instances after a certain threshold is reached at a scale unit level (in a region). Unfortunately, the scale unit where your application is running reached that instance replacement threshold limit by Health Check Feature.</p><p>We are continuously taking steps to improve the Azure Web App service and our processes to ensure such incidents do not occur in the future, and in this case it includes (but is not limited to):</p> <ul> <b><li>Exploring options to increase this limit per scale unit.</li></b> <b><li>Improving the Health Check Feature instance replacement logic.</li></b><b><li>Improving documentation.</li></b></ul> <p>We apologize for any inconvenience.</p> <p>Regards,<br>The Microsoft Azure Team<br><a href=\"https://privacy.microsoft.com/en-us/privacystatement\" target=\"_blank\">Privacy Statement</a></p> </body> </html>"],
      ["Other", ""],
      ["<b>Build/Edit an RCA with ChatGPT!<b>", ""]
        ]);

    categoryMappingKeys = Array.from(this.categoryMapping.keys()); 
    categories = Array.from(this.rcaMapping.keys()); 
    
  
  constructor(private _activatedRoute: ActivatedRoute, private _router: Router,
    private _openAIService: ApplensOpenAIChatService,
    private _diagnosticApiService: DiagnosticApiService,
    private _adalService: AdalService,
    private _userSettingService: UserSettingService,
    private _resourceService: ResourceService,
    private _telemetryService: TelemetryService,
    public _chatUIContextService: ChatUIContextService,
    private _clipboard: ClipboardService) { 


  }

  ngOnInit(): void {
    this.originalResourceProvider = `${this._resourceService.ArmResource.provider}/${this._resourceService.ArmResource.resourceTypeName}`.toLowerCase();
    if (this.originalResourceProvider === 'microsoft.web/sites') {
      this.currentResourceProvider = `${this.originalResourceProvider}${this._resourceService.displayName}`;
    }
    else {
      this.currentResourceProvider = this.originalResourceProvider;
    }
    this._openAIService.CheckEnabled().subscribe(enabled => {
      this.isEnabled = this._openAIService.isEnabled;
      this.isEnabledChecked = true;
      if (this.isEnabled) {
        this._telemetryService.logEvent(TelemetryEventNames.ChatGPTLoaded, { "resourceProvider": this.currentResourceProvider, ts: new Date().getTime().toString()});
      }
    });
    const alias = this._adalService.userInfo.profile ? this._adalService.userInfo.profile.upn : '';
    const userId = alias.replace('@microsoft.com', '');
    this.userAlias = userId;
    this._diagnosticApiService.getUserPhoto(userId).subscribe(image => {
      this._chatUIContextService.userPhotoSource = image;
    });

    if (this._adalService.userInfo.profile) {
      const familyName: string = this._adalService.userInfo.profile.family_name;
      const givenName: string = this._adalService.userInfo.profile.given_name;
      this._chatUIContextService.userNameInitial = `${givenName.charAt(0).toLocaleUpperCase()}${familyName.charAt(0).toLocaleUpperCase()}`;
    }
  }

  mainCategoryClicked(rcaTopic : string) : void {

    debugger; 
    this.currentSelectedRCATopic = rcaTopic;

    if(rcaTopic == "Other"){
      this.otherClicked(); 
      return; 
    }

    else if(rcaTopic == "<b>Build/Edit an RCA with ChatGPT!<b>"){
      this.modifierClicked();
      return; 
    }

    //show subcategories if subcategories not empty 
    // else if(this.categoryMapping.get(this.currentSelectedRCATopic).length != 0 ){
      
    //   this.showRCASubCategories(); 

    // }
    //otherwise show RCA 
    else{
      this.rcaLoading = true; 
      setTimeout(() => {
        this.showRCA()
        
     }, 1000);
    }
    
  }

  //show subcategories 
  // showRCASubCategories(){

  //   this.subcategoriesDisplayed = true; 
  //   debugger; 

  // }

  // subCategoryClicked(rcaTopic : string){
  //   this.rcaLoading = true; 
  //   this.currentSelectedRCATopic = rcaTopic; 
  //   setTimeout(() => {
  //     this.showRCA()
      
  //  }, 1000);

  // }
  

  showRCA(): void{
    debugger; 
    this.rcaLoading = false; 
    //this.subcategoriesDisplayed = false; 
    //this.currentSelectedRCATopic = "Unplanned Hardware";    
    this.currentSelectedRCA = this.rcaMapping.get(this.currentSelectedRCATopic); 
    this.rcaDisplayed = true; 
  }


  backButtonClicked(): void{
    //change states of variables 
    //to return to homepage

    debugger; 
    
    this.displayLoader =  false;
    
    this.modifierDisplayed = false; 
    this.rcaLoading = false; 
    this.rcaDisplayed = false; 
    
    this.currentSelectedRCATopic  = ""; 
    this.currentSelectedRCA = ""; 
    //this.subcategoriesDisplayed = false; 
    this.otherDisplayed = false; 

    this.customFirstMessageEdit = ""; 
  

    
    
  }

  otherClicked(): void {
    this.otherDisplayed = true; 
  }

  modifierClicked(): void {
    debugger; 

    this.rcaDisplayed = false; 
    this.rcaLoading = false; 
    this.otherDisplayed = false; 
    //this.subcategoriesDisplayed = false; 

    if(this.currentSelectedRCA != ""){
      this.customFirstMessageEdit = "\nModify the below RCA to make it more customer-friendly and fix grammar issues:\n " + this.currentSelectedRCA; 
    }

    this.modifierDisplayed = true; 
    this.isEnabled = true; 
    this.isEnabledChecked = true; 

  }

  copyClicked(): void{
    this._clipboard.copyAsHtml(this.currentSelectedRCA);
    this.copyButtonMessage = "Copied!"; 
    setTimeout(() => {
     this.copyButtonMessage = "Copy";  
    }, 2000);

  }


}
