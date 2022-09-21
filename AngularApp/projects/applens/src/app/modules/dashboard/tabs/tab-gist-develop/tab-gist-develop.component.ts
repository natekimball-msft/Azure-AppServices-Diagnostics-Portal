import { Component, OnInit, Input, ViewChild } from '@angular/core';
import { DevelopMode, OnboardingFlowComponent } from '../../onboarding-flow/onboarding-flow.component';
import { ActivatedRoute, NavigationEnd, Params, Router } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'tab-gist-develop',
  templateUrl: './tab-gist-develop.component.html',
  styleUrls: ['./tab-gist-develop.component.scss']
})
export class TabGistDevelopComponent implements OnInit {
  DevelopMode = DevelopMode;
  id: string;
  gradId: string;

  

  constructor(private _route: ActivatedRoute, private _router: Router) {
    this._router.routeReuseStrategy.shouldReuseRoute = function () {
      return false;
    };
  }

  ngOnInit() {
    this._route.params.subscribe((params: Params) => {
      this.refresh();
    });
  }

  @ViewChild("onboardingFlow",{static: true}) onboardingFlowComponent: OnboardingFlowComponent;

  canExit(): boolean {
    return this.onboardingFlowComponent.canExit();
  };

  refresh() {
    this.id = this._route.snapshot.params["gist"].toLowerCase();
    this.gradId = this._route.snapshot.params["gist"];
  }
}
