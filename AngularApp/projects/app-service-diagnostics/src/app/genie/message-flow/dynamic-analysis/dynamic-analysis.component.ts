import { AfterViewInit, Component, EventEmitter, Injector, OnInit, Output, Input } from '@angular/core';
import { Message, TextMessage, ButtonListMessage } from '../../models/message';
import { ActivatedRoute, Router } from '@angular/router';
import { IChatMessageComponent } from '../../interfaces/ichatmessagecomponent';
import { SearchAnalysisMode } from 'projects/diagnostic-data/src/lib/models/search-mode';
import { ContentService } from '../../../shared-v2/services/content.service';
import { CategoryChatStateService } from '../../../shared-v2/services/category-chat-state.service';
import { LoggingV2Service } from '../../../shared-v2/services/logging-v2.service';
import { TelemetryService, TelemetryEventNames } from 'diagnostic-data';
import { v4 as uuid } from 'uuid';
import { ReplaySubject } from 'rxjs';

@Component({
    selector: 'dynamic-analysis',
    templateUrl: './dynamic-analysis.component.html',
    styleUrls: ['./dynamic-analysis.component.scss']
})
export class DynamicAnalysisComponent implements OnInit, AfterViewInit, IChatMessageComponent {

    @Input() keyword: string = "";
    @Input() resourceId: string = "";
    @Input() targetedScore: number = 0.5;
    @Input() documentResultCount: string = "3";
    @Output() onViewUpdate = new EventEmitter();
    @Output() onComplete = new EventEmitter<{ status: boolean, data?: any }>();
    @Input() showFeedbackForm: boolean = true;
    @Output() showFeedbackFormChange: EventEmitter<boolean> = new EventEmitter<boolean>();

    loading: boolean = true;
    searchMode: SearchAnalysisMode = SearchAnalysisMode.Genie;
    viewUpdated: boolean = false;

    constructor(private _routerLocal: Router, private _activatedRouteLocal: ActivatedRoute, private injector: Injector, private _contentService: ContentService, private _chatState: CategoryChatStateService, private _logger: LoggingV2Service, private _telemetryService: TelemetryService) { }
    noSearchResult: boolean = false;
    showFeedback: boolean = undefined;
    feedbackText: string = "";
    readonly Feedback: string = 'Feedback';
    ratingEventProperties: { [name: string]: string };
    content: any[];
    analysisListSubject: ReplaySubject<any> = new ReplaySubject<any>(1);
    showDeepSearchSolution: boolean = false;
    deepSearchPrompt: string = "";

    ngOnInit() {
        this.searchMode = SearchAnalysisMode.Genie;
        this.keyword = this.injector.get('keyword');
        this.resourceId = this.injector.get('resourceId');
        this.targetedScore = this.injector.get('targetedScore');
        this.ratingEventProperties = {
            'DetectorId': "id",
            'Url': window.location.href
        };

        this.analysisListSubject.subscribe((dataOutput) => {
            let nextKey = "";
            if ((dataOutput == undefined || dataOutput.data == undefined || dataOutput.data.detectors == undefined || dataOutput.data.detectors.length === 0) && (this.content == undefined || this.content.length == 0)) {
                this.noSearchResult = true;
            }
            else {
                this.noSearchResult = false;
                nextKey = "feedback";
            }

            let statusValue = {
                status: dataOutput && dataOutput.status ? dataOutput.status : false,
                data: {
                    hasResult: !this.noSearchResult,
                    next_key: nextKey,
                }
            };

            if (dataOutput.status && dataOutput.data && dataOutput.data.issueDetectedViewModels && dataOutput.data.issueDetectedViewModels.length > 0) {
                let numInsights = dataOutput.data.issueDetectedViewModels.length;
                numInsights = numInsights > 3 ? 3 : numInsights;
                let maxLengthEach = Math.floor(400/numInsights);
                let insights = dataOutput.data.issueDetectedViewModels.slice(0, numInsights).map((insight) => { return insight.insightDescription.substring(0, maxLengthEach);}).join("\n");
                this.showDeepSearchSolution = true;
                this.deepSearchPrompt = `UserQuery: ${this.keyword}\n Diagnostic Tool Findings:\n ${insights}`;
            }
            else {
                this.showDeepSearchSolution = false;
                this.deepSearchPrompt = "";
            }

            this.onComplete.emit(statusValue);
            setTimeout(() => {
                this.onViewUpdate.emit();
            }, 100);
            this.viewUpdated = true;
        });
    }

    ngAfterViewInit() {
        if (!this.viewUpdated) {
            this.onViewUpdate.emit();
        }
    }

    updateStatus(dataOutput) {
        this.analysisListSubject.next(dataOutput);
    }

    addHelpfulFeedback() {
        this.feedbackText = 'Great to hear! From 1 to 5 stars, how helpful was this?';
        this.showFeedback = true;
    }

    addNotHelpfulFeedback() {
        this.feedbackText = 'Sorry to hear! Could you let us know how we can improve?';
        this.showFeedback = true;
    }
}

export class DynamicAnalysisMessage extends Message {
    constructor(keyword: string = "", resourceId: string = "", targetedScore: number = 0, messageDelayInMs: number = 0) {
        super(DynamicAnalysisComponent, {
            keyword: keyword,
            resourceId: resourceId,
            targetedScore: targetedScore,
        }, messageDelayInMs);
    }
}
