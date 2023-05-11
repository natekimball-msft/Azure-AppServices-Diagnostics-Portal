import { Component, Inject, Input, OnInit, Output, EventEmitter, OnDestroy } from '@angular/core';
import { DIAGNOSTIC_DATA_CONFIG, DiagnosticDataConfig } from '../../config/diagnostic-data-config';
import { TelemetryService } from '../../services/telemetry/telemetry.service';
import { map, catchError, delay, retryWhen, take } from 'rxjs/operators';
import { v4 as uuid } from 'uuid';
import { TelemetryEventNames } from '../../services/telemetry/telemetry.common';
import { DataRenderBaseComponent } from '../data-render-base/data-render-base.component';
import { ActivatedRoute, Router, Params } from '@angular/router';
import { OpenAIArmService } from '../../services/openai-arm.service';
import { of, Observable, combineLatest } from 'rxjs';
import { ISubscription } from "rxjs/Subscription";
import { WebSearchConfiguration } from '../../models/search';
import { GenericResourceService } from '../../services/generic-resource-service';
import { AvailableDocumentTypes, Query } from '../../models/documents-search-models';
import { GenericSupportTopicService } from '../../services/generic-support-topic.service';
import { DocumentSearchConfiguration } from '../../models/documents-search-config';
import { GenericDocumentsSearchService } from '../../services/generic-documents-search.service';
import { SearchAnalysisMode } from '../../models/search-mode';

@Component({
    selector: 'openai-genie',
    templateUrl: './openai-genie.component.html',
    styleUrls: ['./openai-genie.component.scss']
})

// TODO:ajsharm - Make the links in solution click open in new tab

export class OpenAIGenieComponent extends DataRenderBaseComponent implements OnInit {
    isPublic: boolean = false;
    deepSearchSolution: string = "";
    showDeepSearchSolution: boolean = false;
    fetchingDeepSearchSolution: boolean = false;
    showErrorMessage: boolean = false;
    errorMessage: string = "";
    enabledPesIds: string[] = ["14748"];
    isDisabled: boolean = false;
    @Input() searchPrompt: string = "";
    @Output() onComplete: EventEmitter<any> = new EventEmitter<any>();
    
    constructor(@Inject(DIAGNOSTIC_DATA_CONFIG) config: DiagnosticDataConfig, public telemetryService: TelemetryService,
        private _openAIArmService: OpenAIArmService, private _resourceService: GenericResourceService) {
        super(telemetryService);
        this.isPublic = config && config.isPublic;
    }

    ngOnInit() {
        if (this.searchPrompt && this.searchPrompt.length > 0) {
            this._resourceService.getPesId().subscribe(pesId => {
                if (this.enabledPesIds.includes(pesId)) {
                    this.triggerSearch();
                }
                else {
                    this.isDisabled = true;
                }
            });
        }
    }

    handleRequestFailure() {
        this.errorMessage = "An error occurred while fetching the solution. Click on the button to try again.";
        this.showErrorMessage = true;
    }

    triggerSearch() {
        this.fetchingDeepSearchSolution = true;
        this._openAIArmService.getDeepSearchAnswer(this.searchPrompt).subscribe(result => {
            // do something to display this result
            if (result && result.length > 0) {
                this.deepSearchSolution = result;
                this.showDeepSearchSolution = true;
            }
            this.fetchingDeepSearchSolution = false;
        },
        (err) => {
            this.fetchingDeepSearchSolution = false;
            this.handleRequestFailure();
        });
    }
}  
