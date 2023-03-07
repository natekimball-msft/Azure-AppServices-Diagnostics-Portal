import { Injectable } from '@angular/core';
import { fork } from 'child_process';
import { ResourceDescriptor } from 'diagnostic-data';
import { forkJoin, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApplensDiagnosticService } from '../../modules/dashboard/services/applens-diagnostic.service';

@Injectable({
  providedIn: 'root'
})
export class DevopsserviceService {

  constructor(private _diagnosticsService:ApplensDiagnosticService,) { }

  // Gets all pending changes including active PRs or any pending/failed deployments
  public getPendingChanges(resourceId: string):Observable<any[]> {
    let provider = ResourceDescriptor.parseResourceUri(resourceId).provider;
    let type = ResourceDescriptor.parseResourceUri(resourceId).type;
    let batchObservable = [];
    let result = [];
    this._diagnosticsService.getDevopsChangeList("/", resourceId).subscribe((data: any[]) => {
        let recentCommits = data.slice(0, 10);     
        let activePRObservable = this._diagnosticsService.getDevopsPullRequest(`${provider}/${type}`);
        batchObservable.push(activePRObservable);
        recentCommits.forEach(version => {
          batchObservable.push(this._diagnosticsService.getDevopsCommitStatus(version["commitId"], resourceId));
        })   
      });
      return forkJoin(batchObservable).pipe(map(res => {
        return res;
      }));   
  }

}
