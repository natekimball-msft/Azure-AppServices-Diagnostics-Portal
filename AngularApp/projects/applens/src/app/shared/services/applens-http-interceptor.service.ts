import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpResponse, HttpErrorResponse, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable, of, pipe } from 'rxjs';
import { map, catchError, mergeMap } from 'rxjs/operators';
import { AlertService } from './alert.service';
import { AdalService } from 'adal-angular4';
import { AlertInfo, ConfirmationOption, UserAccessStatus } from '../models/alerts';
import { HealthStatus } from "diagnostic-data";

@Injectable({
  providedIn: 'root'
})
export class AppLensInterceptorService implements HttpInterceptor {
  tokenRefreshRetry: boolean = true;
  constructor(private _alertService: AlertService, private _adalService: AdalService) { }

  raiseAlert(event) {
    let errormsg = event.error;
    errormsg = errormsg.replace(/\\"/g, '"');
    errormsg = errormsg.replace(/\"/g, '"');
    let errobj = JSON.parse(errormsg);
    let message = errobj.DetailText;
    message = message.trim();
    if (message) {
      if (message[message.length - 1] == '.') {
        message = message.substring(0, message.length - 1);
      }
    }
    let alertInfo: AlertInfo = {
      header: "Do you accept the risks?",
      details: `${message}. If you choose to proceed, we will be logging it for audit purposes.`,
      seekConfirmation: true,
      confirmationOptions: [{ label: 'Yes, proceed', value: 'yes' }, { label: 'No, take me back', value: 'no' }],
      alertStatus: HealthStatus.Warning
    };
    this._alertService.sendAlert(alertInfo);
  }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

    return next.handle(req).pipe(map((event: HttpEvent<any>) => {
      if (event instanceof HttpResponse && event.url.includes("api/invoke")) {
      }
      return event;
    }), catchError((error: HttpErrorResponse) => {

      try {
        let errorObj = JSON.parse(error.error);

        if (error.status === 403 && error.url.includes("api/invoke") && errorObj.Status == UserAccessStatus.ResourceNotRelatedToCase) {
          this.raiseAlert(error);
        }
        else if (error.status === 403 && errorObj.Status === 10) {
          this.raiseResourceAlert(error);
        }
        else if ((error.status === 401 || error.status === 403) && error.url.includes("api/invoke")) {
          if (errorObj.DetailText && errorObj.DetailText.includes("the token is expired")) {
            this._adalService.clearCache();
            return this._adalService.acquireToken(this._adalService.config.clientId).pipe(mergeMap((token: string) => {
              this._adalService.userInfo.token = token;
              return next.handle(req);
            }),
              catchError((err) => {
                location.reload();
                return of(null);
              }));
          }
          else {
            this._alertService.notifyUnAuthorized(error);
          }
        }
      }
      catch (e) {
        // Most liely the error.error object was not a json object. Lets consume the json parsing exception and rethrow the original error.
      }

      return Observable.throw(error);
    }));
  }

  // pass in alertInfo instead of event so it's reusable
  raiseResourceAlert(event) {
    let errormsg = event.error;
    errormsg = errormsg.replace(/\\"/g, '"');
    errormsg = errormsg.replace(/\"/g, '"');
    let errobj = JSON.parse(errormsg);
    
    let url = errobj.DetailText;
    url = url.trim();
    if (url) {
      if (url[url.length - 1] == '.') {
        url = url.substring(0, url.length - 1);
      }
    }

    let alertInfo: AlertInfo = {
      header: "Visit the following website to verify your access to the requested subscription.",
      details: `<a href= ${url} target=_blank> ${url} </a>`,
      seekConfirmation: false,
      confirmationOptions: [{ label: 'Yes, proceed', value: 'yes' }, { label: 'No, take me back', value: 'no' }],
      alertStatus: HealthStatus.ResourcePermission
    };
    this._alertService.sendAlert(alertInfo);
  }
}