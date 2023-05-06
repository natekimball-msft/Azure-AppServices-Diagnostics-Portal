import { Component, OnInit, OnChanges, Input, Output, EventEmitter, SimpleChanges } from '@angular/core';
import { PanelType } from 'office-ui-fabric-react';
import { ChatMessage } from '../../../../../../../diagnostic-data/src/public_api';

@Component({
  selector: 'detector-copilot',
  templateUrl: './detector-copilot.component.html',
  styleUrls: ['./detector-copilot.component.scss']
})
export class DetectorCopilotComponent implements OnInit, OnChanges {

  @Input() openPanel: boolean = false;
  @Input() detectorCode: string = '';
  @Input() detectorOutput: string = '';

  @Output() onPanelClose = new EventEmitter();
  @Output() onCodeSuggestion = new EventEmitter<string>();

  userAlias: string = "shgup";
  chatComponentIdentifier: string = "DetectorCopilot";
  contentDisclaimerMessage: string = "* Please do not send any sensitive data in your queries.";
  chatHeader: string = `<h1 class='chatui-header-text'>Detector CoPilot</h1>`;

  panelType: PanelType = PanelType.large;
  panelWidth: string = "1000px";

  ngOnInit(): void {
    setTimeout(() => {
      console.log('sending code');
      let message = 'sure. Here is the detector\npublic class ErrorsDetector\n{\n    // This is a errors detector\n    [AppFilter(AppType = AppType.WebApp, PlatformType = PlatformType.Windows, StackType = StackType.All)]\n    [Definition(Id = \"errors_id\", Name = \"Errors\", Author = \"testuser\", Description = \"Helps in diagnosing errors\")]\n    public async static Task<Response> Run(DataProviders dp, OperationContext<App> cxt, Response res)\n    {\n        // Executing Errors kusto query\n        DataTable errorsDT = await ExecuteErrorsKustoQuery(dp, cxt);\n\n        // Adding Insight for errors\n        AddErrorsInsightToResponse(errorsDT, res);\n\n        // Adding Errors Table to response\n        AddapplicationErrorsTableToResponse(errorsDT, res);\n\n        return res;\n    }\n\n    public static async Task<DataTable> ExecuteErrorsKustoQuery(DataProviders dp, OperationContext<App> cxt)\n    {\n        string kustoQuery = @\"\n            AntaresRuntimeWorkerEvents\n            | where TIMESTAMP > ago(1h)\n            | where Level <= 2 | take 5\n            | project TIMESTAMP, Exception\";\n        return await dp.Kusto.ExecuteQuery(kustoQuery, cxt.Resource.Stamp.Name, cxt.RequestId, \"GetErrors\");\n    }\n\n    public static void AddErrorsInsightToResponse(DataTable dt, Response res) {\n        if(dt != null && dt.Rows.Count > 0)\n        {\n            res.AddInsight(new Insight(InsightStatus.Critical, \"Errors Detected on the application\"));\n        }\n        else\n        {\n            res.AddInsight(new Insight(InsightStatus.Success, \"No Errors Detected on the application\"));\n        }\n    }\n\n    public static void AddapplicationErrorsTableToResponse(DataTable dt, Response res) {\n        if (dt != null && dt.Rows != null)\n        \n        res.Dataset.Add(new DiagnosticData()\n        {\n            Table = dt,\n            RenderingProperties = new TableRendering() {\n                Title = \"Application errors\", \n                Description = \"This table shows top 5 errors on application\"\n            }\n        });\n    }\n}';
      let code = this.extractClassCode(message);
      this.onCodeSuggestion.emit(code);
    }, 6000);
  }

  ngOnChanges(changes: SimpleChanges): void {
  }

  onUserMessageSend(messageObj: ChatMessage): ChatMessage {
    messageObj.message = `${messageObj.message}. Some internal message update`;
    return messageObj;
  }

  onSystemMessageReceived(messageObj: ChatMessage): ChatMessage {
    messageObj.displayMessage = `TEST \n ${messageObj.message}`;
    return messageObj;
  }

  dismissedHandler(): void {
    this.openPanel = false;
    this.onPanelClose.emit();
  }

  private extractClassCode(message: string): string {

    if (message == undefined || message == '' || message.indexOf('public class ') < 0) {
      return '';
    }

    var code = message.substring(message.indexOf('{') + 1);
    code = code.substring(0, code.lastIndexOf('}') - 1);
    var codeParts = code.split('\n');
    var codePartsFormatted = codeParts.map((str) => str.replace("    ", ""));
    return codePartsFormatted.join('\n');
  }
}
