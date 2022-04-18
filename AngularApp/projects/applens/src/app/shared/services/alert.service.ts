import { Injectable, EventEmitter } from '@angular/core';
import { AlertInfo } from '../models/alerts';

@Injectable()
export class AlertService {

  private _alertEvent: EventEmitter<AlertInfo> = new EventEmitter();

  constructor() { }

  public getAlert(): EventEmitter<AlertInfo> {
    return this._alertEvent;
  }

  public sendAlert(alert: AlertInfo) {
    this._alertEvent.emit(alert);
  }
}