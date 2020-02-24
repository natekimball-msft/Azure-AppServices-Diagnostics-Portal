import { Component, Inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DataRenderBaseComponent } from 'projects/diagnostic-data/src/lib/components/data-render-base/data-render-base.component';
import { DiagnosticService } from 'projects/diagnostic-data/src/lib/services/diagnostic.service';
import { TelemetryService } from 'projects/diagnostic-data/src/lib/services/telemetry/telemetry.service';
import { DIAGNOSTIC_DATA_CONFIG, DiagnosticDataConfig } from 'projects/diagnostic-data/src/lib/config/diagnostic-data-config';
import { FeatureNavigationService } from 'projects/diagnostic-data/src/lib/services/feature-navigation.service';
import { DiagnosticData } from 'projects/diagnostic-data/src/lib/models/detector';
import { TelemetryEventNames } from 'projects/diagnostic-data/src/lib/services/telemetry/telemetry.common';


export class CardSelection {
  title: string;
  descriptions: string[];
  icon: string;
  linkType: CardActionType;
  linkValue: string;
}

export enum CardActionType {
  Detector,
  Tool
}

@Component({
  selector: 'card-selection-v4',
  templateUrl: './card-selection-v4.component.html',
  styleUrls: ['./card-selection-v4.component.scss']
})
export class CardSelectionV4Component extends DataRenderBaseComponent {


  cardSelections: CardSelection[] = [];
  colors: string[] = ['rgb(186, 211, 245)', 'rgb(249, 213, 180)', 'rgb(208, 228, 176)', 'rgb(208, 175, 239)', 'rgb(170, 192, 208)', 'rgb(208, 170, 193)', 'rgb(166, 216, 209)', 'rgb(207, 217, 246)'];
  isPublic: boolean;
  constructor(private _diagnosticService: DiagnosticService, private _router: Router,
    private _activatedRoute: ActivatedRoute, protected telemetryService: TelemetryService, private _navigator: FeatureNavigationService, @Inject(DIAGNOSTIC_DATA_CONFIG) config: DiagnosticDataConfig) {
    super(telemetryService);
    this.isPublic = config && config.isPublic;
  }

  protected processData(data: DiagnosticData) {
    super.processData(data);

    data.table.rows.map(row => {
      this.cardSelections.push(<CardSelection>{
        title: row[0],
        descriptions: JSON.parse(row[2]),
        icon: 'fa-bar-chart',
        linkType: parseInt(row[3]),
        linkValue: row[4]
      });
    })
  }

  public selectCard(card: CardSelection) {
    //Todo, fix navigate when CardActionType is Detector
    if (card && card.linkType === CardActionType.Detector) {
      this.logCardClick(card.title);
      if (this.isPublic) {
        this._router.navigate([`../../../detectors/${card.linkValue}`], { relativeTo: this._activatedRoute, queryParamsHandling: 'merge' });
      } else {
        this._navigator.NavigateToDetector(this._activatedRoute.snapshot.params['detector'], card.linkValue);
      }
    } else if (card && card.linkType === CardActionType.Tool) {
      this.logCardClick(card.title);
      if (this.isPublic) {
        //For now, this card only use in DiagTool Category Page
        this._router.navigate([`../tools/${card.linkValue}`], { relativeTo: this._activatedRoute, queryParamsHandling: 'merge' });
      }
    }
  }

  // public getColor(index: number): string {
  //   return this.colors[index % this.colors.length];
  // }

  // Send telemetry event for clicking Card
  logCardClick(title: string) {
    const eventProps = {
      'Title': title,
      'Detector': this.detector
    };
    this.logEvent(TelemetryEventNames.CardClicked, eventProps);
  }
}
