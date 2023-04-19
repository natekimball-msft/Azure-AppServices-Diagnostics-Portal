import { Component, Renderer2, Input, OnInit, AfterViewInit, ViewChildren, QueryList, ElementRef, ViewChild } from '@angular/core';
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
  @ViewChild('raw') raw: ElementRef<HTMLElement>;
  innerText: string;

  slices: Slice[] = [];
  footer: string = 'Powered by App Service Diagnostics AI';
  promptPrefix: string = 'Explain this Win32 status code ';
  html: string = '';

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

  constructor(private chatService: OpenAIArmService, private renderer: Renderer2, private markDownService: MarkdownService, private telemetryService: TelemetryService) { }

  ngOnInit() {
    this.initCoachmarkFlag();

    let text: string;
    if (this.isMarkdown) {
      text = this.markDownService.compile(this.text).trim().replace(/^\<p\>/, '').replace(/\<\/p\>$/, '');
    } else {
      text = this.text;
    }
    this.processWithAiService(text);
    this.updateHtml();
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
      console.log(`slice id=${s.id}, enhance=${s.enhance}, value=${s.value}`);
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

  onTooltipToggle(event: any) {
    return;
    /*
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
    */
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

  updateHtml() {
    for (const slice of this.slices) {
      let sliceHTML;
//      console.log(`slice.id=${slice.id}, slice.value=${slice.value}`);
      if (slice.tooltip) {
        //onClick="onTooltipToggle(event)"
        sliceHTML = `<span id="${slice.id}" class="slice">${slice.value}<img src="assets/img/enhance.svg" class="slice-icon" /><img src="assets/img/enhance-checked.svg" class="slice-icon-hovered" /></span>`;
/*
        const span = this.renderer.createElement('span');
        this.renderer.addClass(span, 'slice');
        this.renderer.setAttribute(span, 'id', slice.id);
        this.renderer.setValue(span, slice.value);

        const imgUnchecked = this.renderer.createElement('img');
        this.renderer.addClass(imgUnchecked, 'slice-icon');
        this.renderer.setAttribute(imgUnchecked, 'src', 'assets/img/enhance.svg');

        const imgChecked = this.renderer.createElement('img');
        this.renderer.addClass(imgChecked, 'slice-icon-hovered');
        this.renderer.setAttribute(imgChecked, 'src', 'assets/img/enhance-checked.svg');

        this.renderer.appendChild(span, imgUnchecked);
        this.renderer.appendChild(span, imgChecked);

        this.renderer.appendChild(this.raw, span);
*/
      } else if (slice.enhance) {
        sliceHTML = slice.value + '<img src="assets/img/enhance.svg" class="slice-icon-notooltip" />';
      } else {
        sliceHTML = slice.value;
      }
      this.html = this.html + sliceHTML;
    }
    console.log('html = ' + this.html);

    for (const slice of this.slices) {
      if (slice.tooltip) {
        const span = this.renderer.selectRootElement('.slice', true);
        console.log(span);
        if (span) {
          this.renderer.setStyle(span, 'text-decoration', 'underline dotted 2px;');
          this.renderer.setAttribute(span, 'id', slice.id);
          this.renderer.setValue(span, slice.value);
        }
      }
    }
  }

  updateHtmlWithInnerHtml() {
    for (const slice of this.slices) {
      let sliceHTML = "";
//      console.log(`slice.id=${slice.id}, slice.value=${slice.value}`);
      if (slice.tooltip) {
        //onClick="onTooltipToggle(event)"
        sliceHTML = `<span id="${slice.id}" class="slice">${slice.value}<img src="assets/img/enhance.svg" class="slice-icon" /><img src="assets/img/enhance-checked.svg" class="slice-icon-hovered" /></span>`;
      } else if (slice.enhance) {
        sliceHTML = slice.value + '<img src="assets/img/enhance.svg" class="slice-icon-notooltip" />';
      } else {
        sliceHTML = slice.value;
      }
      this.html = this.html + sliceHTML;
    }
    console.log('html = ' + this.html);
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
    let r;
    let isCoachmarkSet = false;

    while ((r = match.exec(originalText))) {
      const sliceId = this.getRandomId();
      this.slices.push({ id: this.getRandomId(), enhance: false, value: r.input.substring(lastIndex, r.index) });
      const s: string = r.input.substring(r.index, match.lastIndex);
      // Only the first enhancing slice will have showCoachMark enabled
      this.slices.push({ id: this.getRandomId(), enhance: true, visible: false, value: s, showCoachmark: !isCoachmarkSet });
      isCoachmarkSet = true;
      lastIndex = match.lastIndex;
    }
    this.slices.push({ id: this.getRandomId(), enhance: false, value: originalText.substring(lastIndex) });

    // For each slice, call OpenAI service and store the response
    for (let i = 0; i < this.slices.length; i++) {
      const s = this.slices[i];
      if (s.enhance) {
        const query: string = this.promptPrefix + s.value;
        this.chatService.getAnswer(query, true).subscribe((resp) => {
          if (resp && resp.length > 2 && !resp.trim().toLowerCase().includes("we could not find any information about that")) {
            s.tooltip = resp;
            this.updateHtml();
          }
        },
          error => {
            const e = new Error('failed to retrieve respones from server: ' + error);
            this.telemetryService.logException(e);
          });
      }
    }
  }

  getRandomId(): string {
    return 'slice-' + Math.floor((Math.random() * 10000) + 1).toString();
  }
}

interface Slice {
  id: string;
  enhance: boolean;
  value: string;
  tooltip?: string;
  visible?: boolean;
  showCoachmark?: boolean;
}
