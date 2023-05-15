import { Component, Inject, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { DIAGNOSTIC_DATA_CONFIG, DiagnosticDataConfig } from '../../config/diagnostic-data-config';
import { TelemetryService } from '../../services/telemetry/telemetry.service';
import { DataRenderBaseComponent } from '../data-render-base/data-render-base.component';
import { OpenAIArmService } from '../../services/openai-arm.service';
import { GenericResourceService } from '../../services/generic-resource-service';

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
    @Input() onCallFailure: () => {};
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
                    this.onCallFailure();
                }
            });
        }
    }

    handleRequestFailure() {
        this.errorMessage = "An error occurred while fetching the solution. Click on the button to try again.";
        this.showErrorMessage = true;
        this.onCallFailure();
    }

    triggerSearch() {
        this.fetchingDeepSearchSolution = true;
        this._openAIArmService.getDeepSearchAnswer(this.searchPrompt).subscribe(result => {
            if (result && result.length > 0 && !result.includes("We could not find any information about that")) {
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
