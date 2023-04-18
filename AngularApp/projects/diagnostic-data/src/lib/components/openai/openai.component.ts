import { Component, Input, OnInit, AfterViewInit, ViewChildren, QueryList, ViewContainerRef, ElementRef, ViewChild } from '@angular/core';
import { DirectionalHint } from 'office-ui-fabric-react/lib/Tooltip';
import { ITooltipOptions } from '@angular-react/fabric/lib/components/tooltip';
import { FabTeachingBubbleComponent } from './../../modules/fab-teachingbubble/public-api';
import { OpenAIArmService } from './../../services/openai-arm.service';
import { TelemetryService } from '../../services/telemetry/telemetry.service';
import { TelemetryEventNames } from '../../services/telemetry/telemetry.common';
import { ICalloutProps, ITeachingBubbleProps } from 'office-ui-fabric-react';
import { MarkdownService, MarkedOptions } from 'ngx-markdown';

@Component({
  selector: 'openai',
  templateUrl: './openai.component.html',
  styleUrls: ['./openai.component.scss']
})
export class OpenaiComponent implements OnInit, AfterViewInit {

  @Input() text: string;
  @Input() isMarkdown: boolean;
  @ViewChildren('tip') tips: QueryList<FabTeachingBubbleComponent>;
  @ViewChildren('sv') sliceValues: QueryList<ElementRef<HTMLElement>>;
  innerText: string;

  slices: Slice[] = [];
  chatResponse: string;
  footer: string = 'Powered by App Service Diagnostics AI';
  promptPrefix: string = 'Explain this Win32 status code ';
  html: string;

  // For tooltip display
  directionalHint = DirectionalHint.rightTopEdge;
  toolTipStyles = { 'backgroundColor': 'white', 'color': 'black', 'border': '2px' };
  teachingBubbleCalloutProps: ICalloutProps = {
    directionalHint: DirectionalHint.bottomLeftEdge,
    dismissOnTargetClick: true,
  };
  coachMarkCookieName: string = 'openai-showCoachmark';
  showCoachmark: boolean = true;

  toolTipOptionsValue: ITooltipOptions = {
    calloutProps: {
      styles: {
        beak: this.toolTipStyles,
        beakCurtain: this.toolTipStyles,
        calloutMain: this.toolTipStyles
      }
    },
    styles: {
      content: this.toolTipStyles,
      root: this.toolTipStyles,
      subText: this.toolTipStyles
    }
  }

  coachmarkPositioningContainerProps = {
    directionalHint: DirectionalHint.bottomLeftEdge,
    doNotLayer: true
  };

  constructor(private chatService: OpenAIArmService, private markDownService: MarkdownService, private telemetryService: TelemetryService) { }

  ngOnInit() {
    this.initCoachmarkFlag();

    let text: string;
    if (this.isMarkdown) {
      text = this.markDownService.compile(this.text).trim().replace(/^\<p\>/, '').replace(/\<\/p\>$/, '');
    } else {
      text = this.text;
    }
    this.processWithAiService(text);
  }

  ngAfterViewInit() {
    /*
    // Put s.value into <span>'s innerHTML
    this.sliceValues.forEach(sv => {
      const sid = sv.nativeElement.getAttribute("id");
      for(let i = 0; i < this.slices.length; i++) {
        if (this.slices[i].id === sid) {
          sv.nativeElement.innerHTML = this.slices[i].value;
          break;
        }
      }
    });
    */
    for (let i = 0; i < this.slices.length; i++) {
      const s = this.slices[i];
      if (!s.enhance) {
        //        s.style = lastStyleForUnenhancedSlice;
      }
      console.log(`slice id=${s.id}, enhance=${s.enhance}, styles=${s.styles}, value=${s.value}`);
    }
  }

  initCoachmarkFlag() {
    try {
      const cookie: string = localStorage.getItem(this.coachMarkCookieName) || 'true';
      this.showCoachmark = cookie === 'true';
    }
    catch (error) {
      // Use TelemetryService logEvent when not able to access local storage.
      // Most likely due to browsing in InPrivate/Incognito mode.
      const e = new Error(`Error trying to retrieve ${this.coachMarkCookieName} from localStorage: ` + error);
      this.telemetryService.logException(e);
    }
  }

  onTooltipToggle(slice: any) {
    slice.visible = !slice.visible;
    if (slice.visible && !slice.hasBeenVisible) {
      slice.hasBeenVisible = true;
      const eventProperties = {
        text: slice.value,
        tooltip: slice.tooltip
      };
      this.telemetryService.logEvent(TelemetryEventNames.OpenAiMessageViewed, eventProperties);

      if (slice.showCoachmark) {
        slice.showCoachmark = false;
      }
      if (this.showCoachmark) {
        // Dismiss coachmarks because we need to show the coachmark only once.
        this.showCoachmark = false;
        localStorage.setItem(this.coachMarkCookieName, 'false');
      }
    }
    else if (!slice.visible) {
      this.removeTeachingBubbleFromDom2(slice);
    }
  }

  showTooltip(slice: any) {
    if (!slice.visible) {
      this.onTooltipToggle(slice);
    }
  }

  dismissTooltip(slice: any) {
    if (slice && slice.visible) {
      //      this.removeTeachingBubbleFromDom(slice);
      this.removeTeachingBubbleFromDom2(slice);
    }
  }

  removeTeachingBubbleFromDom(slice: any) {
    const targetLabel = 'teachingbubble-' + slice.id;
    const htmlElements = document.querySelectorAll<HTMLElement>('.ms-TeachingBubble-content');
    for (let i = 0; i < htmlElements.length; i++) {
      const el = htmlElements[i];
      const label = el.getAttribute('aria-labelledby');
      if (label === targetLabel) {
        const calloutContainer: HTMLElement | null = el.closest('.ms-Callout-container');
        if (calloutContainer) {
          calloutContainer.remove();
          slice.visible = false;
        }
      }
    }

    /*
    const htmlElements = document.querySelectorAll<HTMLElement>('.ms-Callout.ms-TeachingBubble');
    if (htmlElements.length > 0) {
      htmlElements[0].parentElement.remove();
    }
    */
  }

  removeTeachingBubbleFromDom2(slice: any) {
    const st = '#' + slice.id;
    this.tips.forEach(c => {
      if (c.target === st) {
        c.reactNodeRef.nativeElement.destroyNode();
      }
    });
    slice.visible = false;
  }

  processWithAiService(originalText: string) {
    if (!originalText) {
      return;
    }

    // TODO: make this customizable
    const match: RegExp = /(?<=^|\s|>|\.|,|\()0x[8-F][0-9A-F]{7}(?=\s|\.|,|<|:|\)|$)/ig;
    let lastIndex = 0;
    let id = 0;
    let r;
    let isCoachmarkSet = false;

    while ((r = match.exec(originalText))) {
      this.slices.push({ id: `slice${id}`, enhance: false, styles: {}, value: r.input.substring(lastIndex, r.index) });
      id++;
      const s: string = r.input.substring(r.index, match.lastIndex);
      // Only the first enhancing slice will have showCoachMark enabled
      this.slices.push({ id: `slice${id}`, enhance: true, visible: false, value: s, showCoachmark: !isCoachmarkSet });
      isCoachmarkSet = true;
      id++;
      lastIndex = match.lastIndex;
    }
    this.slices.push({ id: `slice${id}`, enhance: false, styles: {}, value: originalText.substring(lastIndex) });

    // For each slice, call OpenAI service and store the response
    for (let i = 0; i < this.slices.length; i++) {
      const s = this.slices[i];
      if (s.enhance) {
        const query: string = this.promptPrefix + s.value;
        this.chatService.getAnswer(query, true).subscribe((resp) => {
          if (resp && resp.length > 2 && !resp.trim().toLowerCase().includes("we could not find any information about that")) {
            s.tooltip = resp;
          }
        },
          error => {
            const e = new Error('failed to retrieve respones from server: ' + error);
            this.telemetryService.logException(e);
          });
      }
    }

    for (const slice of this.slices) {
      let sliceHTML = "";
      if (slice.tooltip) {
        sliceHTML = `<span [id]="slice.id" class="slice" (click)="onTooltipToggle(slice)">${slice.value}<img src="assets/img/enhance.svg" class="slice-icon" /><img src="assets/img/enhance-checked.svg" class="slice-icon-hovered" /></span>`;
      } else {
        sliceHTML = slice.value;
      }
      this.html = this.html + sliceHTML;
    }
  }
}

interface Slice {
  id: string;
  enhance: boolean;
  value: string;
  tooltip?: string;
  styles?: any;
  visible?: boolean;
  showCoachmark?: boolean;
}
