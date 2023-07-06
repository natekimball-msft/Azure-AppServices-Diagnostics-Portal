import { AdalService } from 'adal-angular4';
import { Component, OnInit } from '@angular/core';
import {DomSanitizer,SafeResourceUrl,} from '@angular/platform-browser';
import { environment } from '../../../../environments/environment';
import { DiagnosticApiService } from "../../../shared/services/diagnostic-api.service";
import { APIProtocol, ChatMessage, ChatModel, FeedbackOptions } from 'diagnostic-data';
import { ApplensGlobal } from '../../../applens-global';

@Component({
  selector: 'kustogpt',
  templateUrl: './kustogpt.component.html',
  styleUrls: ['./kustogpt.component.scss']
})
export class KustoGPTComponent {

  public apiProtocol = APIProtocol.WebSocket;
  public chatModel = ChatModel.GPT4;
  public feedbackPanelVisible: boolean = true;


  public onDismissed() {
    console.log('onDismissed clicked');
    console.log(this.feedbackPanelVisible);
    this.feedbackPanelVisible = false;
    console.log(this.feedbackPanelVisible);
  }

  
  onFeedbackClicked = (chatMessage:ChatMessage, feedbackType:string):void => {
    if(feedbackType === FeedbackOptions.Dislike) {
      this.feedbackPanelVisible = true;
    }
    else {
      this.feedbackPanelVisible = false;
    }
  }

  constructor(private _applensGlobal:ApplensGlobal) {
    this._applensGlobal.updateHeader('KQL for Antares Analytics'); // This sets the title of the HTML page
    this._applensGlobal.updateHeader(''); // Clear the header title of the component as the chat header is being displayed in the chat UI
    this.prepareChatHeader();
  }

  chatHeader = 'Kusto query generator for Antares Analytics - Preview';
  feedbackEmailAlias = 'applensv2team';

  private prepareChatHeader = () => {
  this.chatHeader = `
  <div class='copilot-header chatui-header-text'>
    <img  class='copilot-header-img' src="/assets/img/bot_sparkle_icon.svg" alt = ''>
    ${this.chatHeader}
    <img class='copilot-header-img-secondary' src='/assets/img/rocket.png' alt=''>
    <img class='copilot-header-img-secondary' src='/assets/img/rocket.png' alt=''">
    <div class = "copilot-header-secondary" >
      Queries generated can be executed against <strong>Cluster:</strong>wawsaneus.eastus <strong>Database:</strong>wawsprod. For more information, see <a target = '_blank' href='https://msazure.visualstudio.com/Antares/_wiki/wikis/Antares.wiki/50081/Getting-started-with-Antares-Analytics-Kusto-data'>Getting started with Antares Analytics Kusto data.</a>
    </div>
  </div>
  `;
  }
}
