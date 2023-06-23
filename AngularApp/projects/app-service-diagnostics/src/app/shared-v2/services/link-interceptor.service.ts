import { Injectable } from '@angular/core';
import { DetectorMetaData, DiagnosticService, TelemetryEventNames, TelemetryService } from 'diagnostic-data';
import { ActivatedRoute, NavigationExtras, Router } from '@angular/router';
import { FeatureService } from './feature.service';

const isAbsolute = new RegExp('(?:^[a-z][a-z0-9+.-]*:|\/\/)', 'i');

@Injectable({
  providedIn: "root"
})
export class LinkInterceptorService {

  constructor(private _diagnosticService: DiagnosticService, private _genericFeatureService: FeatureService) {}

  interceptLinkClick(e: Event, router: Router, detector: string, telemetryService: TelemetryService, activatedRoute: ActivatedRoute) {
    if (e.target && (e.target as any).tagName === 'A') {

      // this.detectorCategoryMapping.forEach(element => {
      //   console.log(JSON.stringify(element));
      // })

      const el = (e.target as HTMLElement);
      let linkURL = el.getAttribute && el.getAttribute('href');
      const linkText = el && el.innerText;

      // Send telemetry event for clicking hyerlink
      const linkClickedProps: { [name: string]: string } = {
        'Title': linkText,
        'Href': linkURL,
        'Detector': detector
      };

      telemetryService.logEvent(TelemetryEventNames.LinkClicked, linkClickedProps);
      let navigationExtras: NavigationExtras = {
        queryParamsHandling: 'preserve',
        preserveFragment: true
      };

      //
      // Don't treat url as relative to the current URL if the 
      // hyper link passed contains a full resourceId
      //

      if (linkURL.toLowerCase().indexOf('subscriptions/') === -1
        && linkURL.toLowerCase().indexOf('/resourcegroups/') === -1) {
        navigationExtras.relativeTo = activatedRoute;
      }

      const metaData = this._diagnosticService.getDetectorById(detector);
      if(metaData && metaData.category) {
        linkURL = this.addCategoryIdIfNeeded(linkURL, metaData);

        if (linkURL && (!isAbsolute.test(linkURL) || linkURL.startsWith('./') || linkURL.startsWith('../'))) {
          e.preventDefault();
          router.navigate([linkURL], navigationExtras);
        } else {
          el.setAttribute('target', '_blank');
        }
      }
    }
  }

  //
  // This function appends 'category/{categoryId}' to the linkURL if
  // we manage to find a category for this detector or analysis and
  // if the existing url does not contain '/category/' at the right
  // location.
  //

  addCategoryIdIfNeeded(linkURL: string, detectorMetaData: DetectorMetaData) {
    //
    // Do not modify URLs with relative URL paths
    //
    if (linkURL.startsWith('..')) {
      return linkURL;
    }
    const entityTypes = ['detectors', 'analysis', 'workflows'];
    for (let index = 0; index < entityTypes.length; index++) {
      const entityType = entityTypes[index];
      if (linkURL.indexOf('/' + entityType + '/') > -1) {
        let linkURLArray = linkURL.split('/');
        let entityTypeIndex = linkURLArray.findIndex(x => x === entityType);
        let entityIdIndex = entityTypeIndex + 1;

        //
        // Check of existense of '/categories/' just two indexes before the
        // entity type. If it exists, no need to append the categoryId as
        // the detector has already passed the right categoryId to the function.
        //
        let categoriesIndex = entityTypeIndex - 2;
        if (categoriesIndex > 0 && linkURLArray[categoriesIndex] === 'categories') {
          return linkURL;
        }

        if (entityTypeIndex > -1 && entityIdIndex < linkURLArray.length) {
          let categoryId = this._genericFeatureService.getCategoryIdByNameAndCurrentCategory(detectorMetaData.category);
          if (!!categoryId && categoryId !== "*") {

            //
            // insert /categories/{CategoryId} just before /detectors/{detectorId}
            //

            linkURLArray.splice(entityTypeIndex, 0, 'categories', categoryId);
            return linkURLArray.join('/');
          }
        }
      }
    }
    return linkURL;
  }
}
