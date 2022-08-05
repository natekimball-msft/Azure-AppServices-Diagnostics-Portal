import { Component, Input, OnInit } from '@angular/core';
import { inputControlHeight } from '@uifabric/azure-themes/lib/azure/Constants';
import { BehaviorSubject } from 'rxjs';
import { getConfigFileParsingDiagnostics } from 'typescript';
import { ApplensDiagnosticService } from '../services/applens-diagnostic.service';

@Component({
  selector: 'applens-doc-section',
  templateUrl: './applens-doc-section.component.html',
  styleUrls: ['./applens-doc-section.component.scss']
})
export class ApplensDocSectionComponent implements OnInit {
  codeObservable: BehaviorSubject<string> = new BehaviorSubject("");
  // list<string> name = new list<string>();

  // @Input() set files(s:string[]){
  //   if(!!s) {
  //     this.codeObservable.next(s);
  //   }
  // }

  // @Input() folderName = "";

  @Input() files = [];
  @Input() fileNames = [];

  //files: string[];
  //fileNames: string[];

  lightOptions = {
    theme: 'vs-dark',
    language: 'csharp',
    fontSize: 14,
    automaticLayout: true,
    scrollBeyondLastLine: false,
    minimap: {
      enabled: false
    },
    folding: true
  };

  editorOptions = this.lightOptions

  isMultipleSamples: boolean = false;


  constructor(private diagnosticApiService: ApplensDiagnosticService) { }

  ngOnInit() {
    this.isMultipleSamples = this.files.length > 1;
    //this.getFiles();
    //console.log(`${this.files}`);
  }

  ngOnChanges(){
    this.isMultipleSamples = this.files.length > 1;
    // this.getFiles("changes");
    // //console.log(`change\nfoldername: ${this.folderName}\n`);
  }

  run(){
    console.log("ran");
  }

  // track(index: number, file: any){
  //   return file.id;
  // }

  // getFiles(){
  //   this.diagnosticApiService.getDetectorCode(`documentation/insight/${this.folderName}/content`, "darreldonald/documentationTestBranch", "/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/Fake-RG/providers/Microsoft.AzurePortal/sessions/adasdasdasdasd/").subscribe(names => {
  //     this.fileNames = names.split('\n');
  //     this.fileNames.forEach(f => {
  //       this.diagnosticApiService.getDetectorCode(`documentation/insight/${this.folderName}/${f.replace(/\s/g,"")}`, "darreldonald/documentationTestBranch", "/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/Fake-RG/providers/Microsoft.AzurePortal/sessions/adasdasdasdasd/").subscribe(fileContent => {
  //         this.files.push(fileContent);
  //         // console.log(caller, fileContent)
  //       });
  //     });
  //   });
  // }

  // onInit(editor: any) {
  //   this._monacoEditor = editor;
  //   let getEnabled = this._diagnosticApi.get('api/appsettings/CodeCompletion:Enabled');
  //   let getServerUrl = this._diagnosticApi.get('api/appsettings/CodeCompletion:LangServerUrl');
  //   forkJoin([getEnabled, getServerUrl]).subscribe(resList => {
  //     this.codeCompletionEnabled = resList[0] == true || resList[0].toString().toLowerCase() == "true";
  //     this.languageServerUrl = resList[1];
  //     if (this.codeCompletionEnabled && this.languageServerUrl && this.languageServerUrl.length > 0) {
  //       if (this.code.indexOf(codePrefix) < 0) {
  //         this.code = this.addCodePrefix(this.code);
  //       }
  //       let fileName = uuid();
  //       let editorModel = monaco.editor.createModel(this.code, 'csharp', monaco.Uri.parse(`file:///workspace/${fileName}.cs`));
  //       editor.setModel(editorModel);
  //       MonacoServices.install(editor, { rootUri: "file:///workspace" });
  //       const webSocket = this.createWebSocket(this.languageServerUrl);
  //       listen({
  //         webSocket,
  //         onConnection: connection => {
  //           // create and start the language client
  //           const languageClient = this.createLanguageClient(connection);
  //           const disposable = languageClient.start();
  //           connection.onClose(() => disposable.dispose());
  //         }
  //       });
  //     }
  //   });
  // }
}
