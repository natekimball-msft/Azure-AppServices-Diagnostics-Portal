import * as momentNs from 'moment';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, NavigationExtras, Router } from '@angular/router';
import {
  ResourceServiceInputs, ResourceType, ResourceTypeState, ResourceServiceInputsJsonResponse
} from '../../../shared/models/resources';
import { HttpClient } from '@angular/common/http';
import { DropdownMenuItemType, IDropdownOption, IDropdownProps, PanelType, SpinnerSize } from 'office-ui-fabric-react';
import { BehaviorSubject } from 'rxjs';
import { DataTableResponseObject, DetectorControlService, HealthStatus } from 'diagnostic-data';
import { AdalService } from 'adal-angular4';
import { UserSettingService } from '../../dashboard/services/user-setting.service';
import { RecentResource } from '../../../shared/models/user-setting';
import { ResourceDescriptor } from 'diagnostic-data'
import { applensDocs } from '../../../shared/utilities/applens-docs-constant';
import {DiagnosticApiService} from '../../../shared/services/diagnostic-api.service';
const moment = momentNs;

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss']
})
export class MainComponent implements OnInit {
  showResourceTypeOptions = false;
  showCaseCleansingOption = false;
  selectedResourceType: ResourceTypeState;
  resourceName: string;
  openResourceTypePanel: boolean = false;
  resourceTypeList: any = [];
  type: PanelType = PanelType.custom;
  width: string = "850px";
  panelStyles: any = {
    root: {
      marginTop: '50px',
    }
  }

  displayLoader: boolean = false;
  loaderSize = SpinnerSize.large;
  caseNumberNeededForUser: boolean = false;
  caseNumber: string = '';
  caseNumberValidationError: string = null;
  accessErrorMessage: string = '';
  userAccessErrorMessage: string = '';
  displayUserAccessError: boolean = false;

  defaultResourceTypes: ResourceTypeState[] = [
    {
      resourceType: "Microsoft.Web/sites",
      resourceTypeLabel: 'App name',
      routeName: (name) => `sites/${name}`,
      displayName: 'App Service',
      enabled: true,
      caseId: false,
      durianEnabled: true
    },
    {
      resourceType: "Microsoft.Web/hostingEnvironments",
      resourceTypeLabel: 'ASE name',
      routeName: (name) => `hostingEnvironments/${name}`,
      displayName: 'App Service Environment',
      enabled: true,
      caseId: false,
      durianEnabled: false
    },
    {
      resourceType: "Microsoft.Web/containerApps",
      resourceTypeLabel: 'Container App Name',
      routeName: (name) => `containerapps/${name}`,
      displayName: 'Container App',
      enabled: true,
      caseId: false,
      durianEnabled: false
    },
    {
      resourceType: "Microsoft.Compute/virtualMachines",
      resourceTypeLabel: 'Virtual machine Id',
      routeName: (name) => this.getFakeArmResource('Microsoft.Compute', 'virtualMachines', name),
      displayName: 'Virtual Machine',
      enabled: true,
      caseId: false,
      durianEnabled: false
    },
    {
      resourceType: "ARMResourceId",
      resourceTypeLabel: 'ARM Resource ID',
      routeName: (name) => `${name}`,
      displayName: 'ARM Resource ID',
      enabled: true,
      caseId: false,
      durianEnabled: false
   }
  ];
  resourceTypes: ResourceTypeState[] = [];

  startTime: momentNs.Moment;
  endTime: momentNs.Moment;
  enabledResourceTypes: ResourceServiceInputs[];
  inIFrame = false;
  errorMessage = "";
  status = HealthStatus.Critical;

  fabDropdownOptions: IDropdownOption[] = [];
  fabDropdownStyles: IDropdownProps["styles"] = {
    dropdownItemsWrapper: {
      maxHeight: '30vh'
    },
  }
  openTimePickerSubject: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  timePickerStr: string = "";
  get disableSubmitButton(): boolean {
    return !this.resourceName || this.resourceName.length === 0;
  }
  troubleShootIcon: string = "../../../../assets/img/applens-skeleton/main/troubleshoot.svg";
  userGivenName: string = "";
  table: RecentResourceDisplay[];
  applensDocs = applensDocs;

  constructor(private _router: Router, private _http: HttpClient, private _detectorControlService: DetectorControlService, private _adalService: AdalService, private _userInfoService: UserSettingService, private _diagnosticApiService: DiagnosticApiService, private _activatedRoute: ActivatedRoute) {
    this.endTime = moment.utc();
    this.startTime = this.endTime.clone().add(-1, 'days');
    this.inIFrame = window.parent !== window;
    
    if (this.inIFrame) {
      this.resourceTypes = this.resourceTypes.filter(resourceType => !resourceType.caseId);
    }

    if (this._activatedRoute.snapshot.queryParams['caseNumber'] && this._activatedRoute.snapshot.queryParams['caseNumber'] !== "undefined") {
      this.caseNumber = this._activatedRoute.snapshot.queryParams['caseNumber'];
    }
    if (this._activatedRoute.snapshot.queryParams['resourceName']) {
      this.resourceName = this._activatedRoute.snapshot.queryParams['resourceName'];
    }
    if (this._activatedRoute.snapshot.queryParams['errorMessage']) {
      this.accessErrorMessage = this._activatedRoute.snapshot.queryParams['errorMessage'];
    }
    if (this._activatedRoute.snapshot.queryParams['resourceType']) {
      let foundResourceType = this.defaultResourceTypes.find(resourceType => resourceType.resourceType === this._activatedRoute.snapshot.queryParams['resourceType']);
      if (!foundResourceType) {
        this.selectedResourceType = this.defaultResourceTypes.find(resourceType => resourceType.resourceType === "ARMResourceId");
        this.resourceName = this._activatedRoute.snapshot.queryParams['resourceId'];
      }
      else {
        this.selectedResourceType = foundResourceType;
      }
    }
  }

  validateCaseNumber(){
    if (!this.caseNumber || this.caseNumber.length < 12) {
      this.caseNumberValidationError = "Case number too short";
      return false;
    }
    if (this.caseNumber.length > 18) {
      this.caseNumberValidationError = "Case number too long";
      return false;
    }
    if (this.caseNumber && this.caseNumber.length > 0 && isNaN(Number(this.caseNumber))){
      this.caseNumberValidationError = "Case number should be a valid number";
      return false;
    }
    else {
      this.caseNumberValidationError = "";
      return true;
    }
  }

  fetchUserDetails() {
    this.displayLoader = true;
    this.userAccessErrorMessage = '';
    this.displayUserAccessError = false;
    this._diagnosticApiService.checkUserAccess().subscribe(res => {
      if (res && res.Status == UserAccessStatus.CaseNumberNeeded) {
        this.caseNumberNeededForUser = true;
        this.displayLoader = false;
      }
      else {
        this.displayLoader = false;
      }
    },(err) => {
      let errormsg = err.error;
      errormsg = errormsg.replace(/\\"/g, '"');
      errormsg = errormsg.replace(/\"/g, '"');
        let errobj = JSON.parse(errormsg);
        this.displayUserAccessError = true;
        this.userAccessErrorMessage = errobj.DetailText;
        this.displayLoader = false;
    });
  }

  ngOnInit() {
    this.fetchUserDetails();
    this.resourceTypes = [...this.defaultResourceTypes];
    if (!this.selectedResourceType)
    this.selectedResourceType = this.resourceTypes[0];

    this.defaultResourceTypes.forEach(resource => {
      this.fabDropdownOptions.push({
        key: resource.displayName,
        text: resource.displayName,
        ariaLabel: resource.displayName
      });
    });

    this.resourceTypeList = [
        {name: "App", imgSrc: "assets/img/Azure-WebApps-Logo.png"},
        {name: "Linux App", imgSrc: "assets/img/Azure-Tux-Logo.png"},
        {name: "Function App", imgSrc: "assets/img/Azure-Functions-Logo.png"},
        {name: "Logic App", imgSrc: "assets/img/Azure-LogicAppsPreview-Logo.svg"},
        {name: "App Service Environment",  imgSrc: "assets/img/ASE-Logo.jpg"},
        {name: "Virtual Machine", imgSrc: "assets/img/Icon-compute-21-Virtual-Machine.svg"},
        {name:  "Container App", imgSrc: "assets/img/Azure-ContainerApp-Logo.png"}];

    // TODO: Use this to restrict access to routes that don't match a supported resource type
    this._http.get<ResourceServiceInputsJsonResponse>('assets/enabledResourceTypes.json').subscribe(jsonResponse => {
      this.enabledResourceTypes = <ResourceServiceInputs[]>jsonResponse.enabledResourceTypes;
      this.enabledResourceTypes.forEach(type => {
        const searchSuffix = type.searchSuffix;
        if (searchSuffix && searchSuffix.length > 0 && !this.resourceTypes.find(resource => resource.displayName && searchSuffix && resource.displayName.toLowerCase() === searchSuffix.toLowerCase())) {
          this.resourceTypes.push({
            resourceType: type.resourceType,
            resourceTypeLabel: 'ARM resource ID',
            routeName: (name) => `${name}`,
            displayName: `${searchSuffix}`,
            enabled: true,
            caseId: false,
            durianEnabled: type.durianEnabled? type.durianEnabled: false
          });
        }
      });

      const list = this.enabledResourceTypes.filter(type => this.defaultResourceTypes.findIndex(defaultResource => defaultResource.displayName === type.displayName) === -1);

      list.sort((a,b) => {
        return a.displayName.localeCompare(b.displayName);
      })

      list.forEach(resource => {
        this.resourceTypes.push({
          resourceType: resource.resourceType,
          resourceTypeLabel: 'ARM resource ID',
          routeName: (name) => `${name}`,
          displayName: `${resource.displayName}`,
          enabled: true,
          caseId: false,
          durianEnabled: resource.durianEnabled? resource.durianEnabled: false
        });

        if (this.resourceTypeList.findIndex(item => item.name.toLowerCase() === resource.displayName.toLowerCase()) < 0)
        {
            this.resourceTypeList.push({name: resource.displayName, imgSrc: resource? resource.imgSrc: ""})
        }
      });

      this._userInfoService.getRecentResources().subscribe(userInfo => {
        if (userInfo && userInfo.resources) {
          this.table = this.generateDataTable(userInfo.resources);
        }
      });
    });


    this._detectorControlService.timePickerStrSub.subscribe(s => {
      this.timePickerStr = s;
      this._detectorControlService.timeRangeErrorString
    });

    this.userGivenName = this._adalService.userInfo.profile.given_name;

  }

  openResourcePanel()
  {
      this.openResourceTypePanel = true;
  }

  dismissedHandler() {
    this.openResourceTypePanel = false;
 }

  selectResourceType(type: ResourceTypeState) {
    if (type.enabled) {
      this.selectedResourceType = type;
      this.showResourceTypeOptions = false;
    }
  }

  selectDropdownKey(e: { option: IDropdownOption, index: number }) {
    const resourceType = this.resourceTypes.find(resource => resource.displayName === e.option.key);
    this.selectResourceType(resourceType);
  }

  private normalizeArmUriForRoute(resourceURI: string, enabledResourceTypes: ResourceServiceInputs[]): string {
    resourceURI = resourceURI.trim();
    const resourceUriPattern = /subscriptions\/(.*)\/resourceGroups\/(.*)\/providers\/(.*)/i;
    const result = resourceURI.match(resourceUriPattern);

    if (result && result.length === 4) {
      let allowedResources: string = "";
      let routeString: string = '';

      if (enabledResourceTypes) {
        enabledResourceTypes.forEach(enabledResource => {
          allowedResources += `${enabledResource.resourceType}\n`;
          const resourcePattern = new RegExp(
            `(?<=${enabledResource.resourceType.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}\/).*`, 'i'
          );
          const enabledResourceResult = result[3].match(resourcePattern);

          if (enabledResourceResult) {
            routeString = `subscriptions/${result[1]}/resourceGroups/${result[2]}/providers/${enabledResource.resourceType}/${enabledResourceResult[0]}`;
          }
        });
      }

      this.errorMessage = routeString === '' ?
        'The supplied ARM resource is not enabled in AppLens. Allowed resource types are as follows\n\n' +
        `${allowedResources}` :
        '';

      return routeString;
    } else {
      this.errorMessage = "Invalid ARM resource id. Resource id must be of the following format:\n" +
        `  /subscriptions/<sub id>/resourceGroups/<resource group>/providers/${this.selectedResourceType.resourceType}/` +
        "<resource name>";

      return resourceURI;
    }
  }

  onSubmit() {
    this.caseNumber = this.caseNumber.trim();
    if (this.caseNumberNeededForUser && (this.selectedResourceType && this.selectedResourceType.durianEnabled)) {
      if (!this.validateCaseNumber()){
        return;
      }
    }
    this._diagnosticApiService.setCustomerCaseNumber(this.caseNumber);
    this.resourceName = this.resourceName.trim();

    //If it is ARM resource id
    //if (this.defaultResourceTypes.findIndex(resource => this.selectedResourceType.displayName === resource.displayName) === -1) {
    if (this.selectedResourceType.displayName === "ARM Resource ID") {
      this.resourceName = this.normalizeArmUriForRoute(this.resourceName, this.enabledResourceTypes);
    } else {
      this.errorMessage = "";
    }

    let route = this.selectedResourceType.routeName(this.resourceName);

    if (route === 'srid') {
      window.location.href = `https://azuresupportcenter.msftcloudes.com/caseoverview?srId=${this.resourceName}`;
    }


    this._detectorControlService.setCustomStartEnd(this._detectorControlService.startTime,this._detectorControlService.endTime);

    let timeParams = {
      startTime: this._detectorControlService.startTimeString,
      endTime: this._detectorControlService.endTimeString
    }

    let navigationExtras: NavigationExtras = {
      queryParams: {
        ...timeParams,
        caseNumber: this.caseNumber
      },
    }
    
    if (this.errorMessage === '') {
      this._router.navigate([route], navigationExtras);
    }
  }

  caseCleansingNavigate() {
    this._router.navigate(["caseCleansing"]);
  }

  private getFakeArmResource(rpName: string, serviceName: string, resourceName: string): string {
    let fakeRes = `/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/Fake-RG/providers/${rpName}/${serviceName}/${resourceName}`;
    return fakeRes;
  }

  openTimePicker() {
    this.openTimePickerSubject.next(true);
  }


  private generateDataTable(recentResources: RecentResource[]) {

    let rows: RecentResourceDisplay[];
    rows = recentResources.map(recentResource => {
      var descriptor = ResourceDescriptor.parseResourceUri(recentResource.resourceUri);
      const name = descriptor.resource;
      const type = `${descriptor.provider}/${descriptor.type}`.toLowerCase();
      const resourceType = this.enabledResourceTypes.find(t => t.resourceType.toLocaleLowerCase() === type);
      const display: RecentResourceDisplay = {
        name: name,
        imgSrc: resourceType ? resourceType.imgSrc : "",
        type: resourceType ? resourceType.displayName : "",
        kind: recentResource.kind,
        resourceUri: recentResource.resourceUri
      }
      if (type === "microsoft.web/sites") {
        this.updateDisplayWithKind(recentResource.kind, display);
      }
      return display;
    });
    return rows;
  }

  //To do, Add a utility method to check kind and use in main.component and site.service
  private updateDisplayWithKind(kind: string, recentResourceDisplay: RecentResourceDisplay) {
    if (kind && kind.toLowerCase().indexOf("workflowapp") !== -1) {
      recentResourceDisplay.imgSrc = "assets/img/Azure-LogicAppsPreview-Logo.svg";
      recentResourceDisplay.type = "Logic App";
    } else if (kind && kind.toLowerCase().indexOf("functionapp") !== -1) {
      recentResourceDisplay.imgSrc = "assets/img/Azure-Functions-Logo.png";
      recentResourceDisplay.type = "Function App";
    } else if (kind && kind.toLowerCase().indexOf("linux") !== -1) {
      recentResourceDisplay.imgSrc = "assets/img/Azure-Tux-Logo.png";
      recentResourceDisplay.type = "Linux Web App";
    }
  }

  //Todo, once get startTime,endTime from database,replace with those get from detectorControlService
  private onNavigateRecentResource(recentResource: RecentResourceDisplay) {
    let startUtc = this._detectorControlService.startTime;
    let endUtc = this._detectorControlService.endTime;

    let timeParams = {
      startTime: startUtc ? startUtc.format('YYYY-MM-DDTHH:mm') : "",
      endTime: endUtc ? endUtc.format('YYYY-MM-DDTHH:mm') : ""
    }

    let navigationExtras: NavigationExtras = {
      queryParams: timeParams
    }
    const route = recentResource.resourceUri
    this._router.navigate([route], navigationExtras);
  }

  clickRecentResourceHandler(event: Event, recentResource: RecentResourceDisplay) {
    event.stopPropagation();
    this.onNavigateRecentResource(recentResource);
  }


}

interface RecentResourceDisplay extends RecentResource {
  name: string;
  imgSrc: string;
  type: string;
}

enum UserAccessStatus
{
  Unauthorized,
  Forbidden,  
  NotFound, 
  BadRequest,  
  ResourceNotRelatedToCase,  
  RequestFailure,
  SGMembershipNeeded,
  CaseNumberNeeded,
  HasAccess
}


