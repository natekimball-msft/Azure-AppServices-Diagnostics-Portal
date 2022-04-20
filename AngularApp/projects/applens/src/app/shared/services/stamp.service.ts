import { BehaviorSubject, Observable } from 'rxjs';
import { map, mergeMap } from 'rxjs/operators';
import { Inject, Injectable } from '@angular/core';
import { RESOURCE_SERVICE_INPUTS, ResourceServiceInputs, ResourceInfo } from '../models/resources';
import { ObserverService } from './observer.service';
import { ResourceService } from './resource.service';
import { HttpResponse } from '@angular/common/http';

@Injectable()
export class StampService extends ResourceService {

  private _currentResource: BehaviorSubject<Observer.ObserverStampInfo> = new BehaviorSubject(null);

  private _stampObject: Observer.ObserverStampInfo;

  constructor(@Inject(RESOURCE_SERVICE_INPUTS) inputs: ResourceServiceInputs, protected _observerApiService: ObserverService) {
    super(inputs);
  }

  public startInitializationObservable() {
    this._initialized = this._observerApiService.getStamp(this._armResource.resourceName)
      .pipe(map((observerResponse: Observer.ObserverStampResponse) => {
        this._observerResource = this._stampObject = this.getStampInfoFromObserverResponse(observerResponse);
        this._currentResource.next(this._stampObject);
        return new ResourceInfo(this.getResourceName(),this.imgSrc,this.displayName,this.getCurrentResourceId());
      }))
  }

    public getCurrentResource(): Observable<any> {
        return this._currentResource;
    }

    public getCurrentResourceId(forDiagApi?: boolean): string {
        return `infrastructure/stamps/${this._armResource.resourceName}`;
    }

    private getStampInfoFromObserverResponse(observerResponse: Observer.ObserverStampResponse): Observer.ObserverStampInfo {
        return {
            Name: observerResponse.details.prod_environment.name,
            SubscriptionId: observerResponse.details.prod_environment.subscription_id,
            StampType: observerResponse.details.prod_environment.dns.includes("cloudapp.azure.com")? "CloudService": "VMSS",
            DNS: observerResponse.details.prod_environment.dns,
            VIP: observerResponse.details.prod_environment.vip,
            DeploymentId: observerResponse.details.prod_environment.deployment_id,
            Cluster: observerResponse.details.prod_environment.cluster,
            IsFlexStamp: observerResponse.details.is_flex_stamp,
            GeoLocation: observerResponse.details.geo_location,
        };
    }
}
