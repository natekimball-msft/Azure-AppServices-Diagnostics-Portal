import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { inputControlHeight } from '@uifabric/azure-themes/lib/azure/Constants';
import { ICommandBarItemProps, ICommandBarProps } from 'office-ui-fabric-react';
import { CompilationProperties } from 'projects/diagnostic-data/src/lib/models/compilation-properties';
import { CompilationTraceOutputDetails, LocationSpan, Position, QueryResponse } from 'projects/diagnostic-data/src/lib/models/compiler-response';
import { DetectorResponse, HealthStatus } from 'projects/diagnostic-data/src/lib/models/detector';
import { DetectorControlService } from 'projects/diagnostic-data/src/lib/services/detector-control.service';
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
    theme: 'vs',
    language: 'csharp',
    fontSize: 14,
    automaticLayout: true,
    scrollBeyondLastLine: false,
    minimap: {
      enabled: false
    },
    folding: true
  };

//   detectorCodeStart = `[SystemFilter]
//   [Definition(Id = "__documentation_sample__", Name = "sample code", Author = "darreldonald", Description = "")]
//   public async static Task<Response> Run(DataProviders dp, Dictionary<string, dynamic> cxt, Response res)
//   {
//     await Task.Delay(1);
//       `;
//   detectorCodeEnd = `
//   return res;
// }`

  editorOptions = this.lightOptions

  isMultipleSamples: boolean = false;

  commandbarStyle: ICommandBarProps['styles'] = {
    root: {
      backgroundColor: '#e6e6e6',
      color: '#e6e6e6',
      height: '29px'
    },
    primarySet: {
      backgroundColor: '#e6e6e6',
      color: '#e6e6e6',
    }
    // secondarySet: {
    //   backgroundColor: '#e6e6e6',
    //   color: '#e6e6e6',
    // }
  }

  commandBarButtonStyle: ICommandBarItemProps['buttonStyles'] = {
    root: {
      backgroundColor: '#e6e6e6'
    }
  }

  runButtonDisabled: boolean = false;
  buildOutput: string[];
  detailedCompilationTraces: CompilationTraceOutputDetails[];
  reference: object = {};
  runButtonText = "Run";
  compilationPackage: CompilationProperties  = new CompilationProperties();
  queryResponse: QueryResponse<DetectorResponse>;
  public showDetailedCompilationTraces: boolean = true;
  runButtonStyle: any = {
    root: { cursor: "default" }
  };
  runIcon: any = { iconName: 'Play' };
  private _monacoEditor: monaco.editor.ICodeEditor = null;
  errorState: any;

  constructor(private diagnosticApiService: ApplensDiagnosticService, private _activatedRoute: ActivatedRoute, private _detectorControlService: DetectorControlService) { }

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
  
  testrun(line: string){
    console.log(line);
  }

  runCompilation(code: string) {
    // let code = `${this.detectorCodeStart}${sample}${this.detectorCodeEnd}`;
    if (this.runButtonDisabled) {
      return;
    }
    this.buildOutput = [];
    this.buildOutput.push("------ Build started ------");
    this.detailedCompilationTraces = [];
    this.detailedCompilationTraces.push({
      severity: HealthStatus.None,
      message: '------ Build started ------',
      location: {
        start: {
          linePos: 0,
          colPos: 0
        } as Position,
        end: {
          linePos: 0,
          colPos: 0
        } as Position
      } as LocationSpan
    } as CompilationTraceOutputDetails);
    let currentCode = code;
    //this.markCodeLinesInEditor(null);

    var body = {
      script: code,
      references: this.reference,
      entityType: 'signal'
    };

    this.disableRunButton();
    this.runButtonText = "Running";

    // let isSystemInvoker: boolean = this.mode === DevelopMode.EditMonitoring || this.mode === DevelopMode.EditAnalytics;
    let isSystemInvoker: boolean = false;

    this._activatedRoute.queryParams.subscribe((params: Params) => {
      let queryParams = JSON.parse(JSON.stringify(params));
      queryParams.startTime = undefined;
      queryParams.endTime = undefined;
      let serializedParams = this.serializeQueryParams(queryParams);
      if (serializedParams && serializedParams.length > 0) {
        serializedParams = "&" + serializedParams;
      };
      this.diagnosticApiService.getCompilerResponse(body, isSystemInvoker, "__documentation_sample__", this._detectorControlService.startTimeString,
        this._detectorControlService.endTimeString, '', '', {
        scriptETag: this.compilationPackage.scriptETag,
        assemblyName: this.compilationPackage.assemblyName,
        formQueryParams: serializedParams,
        getFullResponse: true
      }, "__documentation_sample__", true)
        .subscribe((response: any) => {
          this.queryResponse = response.body;
          
          this.enableRunButton();
          this.runButtonText = "Run";
          if (this.queryResponse.compilationOutput.compilationTraces) {
            this.queryResponse.compilationOutput.compilationTraces.forEach(element => {
              this.buildOutput.push(element);
            });
          }
          if (this.queryResponse.compilationOutput.detailedCompilationTraces) {
            this.showDetailedCompilationTraces = true;
            this.queryResponse.compilationOutput.detailedCompilationTraces.forEach(traceElement => {
              this.detailedCompilationTraces.push(traceElement);
            });
          }
          else {
            this.showDetailedCompilationTraces = false;
          }
          // If the script etag returned by the server does not match the previous script-etag, update the values in memory
          if (response.headers.get('diag-script-etag') != undefined && this.compilationPackage.scriptETag !== response.headers.get('diag-script-etag')) {
            this.compilationPackage.scriptETag = response.headers.get('diag-script-etag');
            this.compilationPackage.assemblyName = this.queryResponse.compilationOutput.assemblyName;
            this.compilationPackage.assemblyBytes = this.queryResponse.compilationOutput.assemblyBytes;
            this.compilationPackage.pdbBytes = this.queryResponse.compilationOutput.pdbBytes;
          }

          if (this.queryResponse.compilationOutput.compilationSucceeded === true) {
            this.buildOutput.push("========== Build: 1 succeeded, 0 failed ==========");
            this.detailedCompilationTraces.push({
              severity: HealthStatus.None,
              message: '========== Build: 1 succeeded, 0 failed ==========',
              location: {
                start: {
                  linePos: 0,
                  colPos: 0
                } as Position,
                end: {
                  linePos: 0,
                  colPos: 0
                } as Position
              } as LocationSpan
            } as CompilationTraceOutputDetails);
          } else {
            this.buildOutput.push("========== Build: 0 succeeded, 1 failed ==========");
            this.detailedCompilationTraces.push({
              severity: HealthStatus.None,
              message: '========== Build: 0 succeeded, 1 failed ==========',
              location: {
                start: {
                  linePos: 0,
                  colPos: 0
                } as Position,
                end: {
                  linePos: 0,
                  colPos: 0
                } as Position
              } as LocationSpan
            } as CompilationTraceOutputDetails);
          }

          if (this.queryResponse.runtimeLogOutput) {
            this.queryResponse.runtimeLogOutput.forEach(element => {
              if (element.exception) {
                this.buildOutput.push(element.timeStamp + ": " +
                  element.message + ": " +
                  element.exception.ClassName + ": " +
                  element.exception.Message + "\r\n" +
                  element.exception.StackTraceString);

                this.detailedCompilationTraces.push({
                  severity: HealthStatus.Critical,
                  message: `${element.timeStamp}: ${element.message}: ${element.exception.ClassName}: ${element.exception.Message}: ${element.exception.StackTraceString}`,
                  location: {
                    start: {
                      linePos: 0,
                      colPos: 0
                    },
                    end: {
                      linePos: 0,
                      colPos: 0
                    }
                  }
                });
              }
              else {
                this.buildOutput.push(element.timeStamp + ": " + element.message);
                this.detailedCompilationTraces.push({
                  severity: HealthStatus.Info,
                  message: `${element.timeStamp}: ${element.message}`,
                  location: {
                    start: {
                      linePos: 0,
                      colPos: 0
                    },
                    end: {
                      linePos: 0,
                      colPos: 0
                    }
                  }
                });
              }
            });
          }

          //this.markCodeLinesInEditor(this.detailedCompilationTraces);
        }, ((error: any) => {
          this.enableRunButton();
          this.runButtonText = "Run";
          this.buildOutput.push("Something went wrong during detector invocation.");
          this.buildOutput.push("========== Build: 0 succeeded, 1 failed ==========");
          this.detailedCompilationTraces.push({
            severity: HealthStatus.Critical,
            message: 'Something went wrong during detector invocation.',
            location: {
              start: {
                linePos: 0,
                colPos: 0
              },
              end: {
                linePos: 0,
                colPos: 0
              }
            }
          });
          this.detailedCompilationTraces.push({
            severity: HealthStatus.None,
            message: '========== Build: 0 succeeded, 1 failed ==========',
            location: {
              start: {
                linePos: 0,
                colPos: 0
              },
              end: {
                linePos: 0,
                colPos: 0
              }
            }
          });
          //this.markCodeLinesInEditor(this.detailedCompilationTraces);
        }));
    });
  }

  disableRunButton() {
    this.runButtonDisabled = true;
    this.runButtonStyle = {
      root: {
        cursor: "not-allowed",
        color: "grey"
      }
    };
    this.runIcon = {
      iconName: 'Play',
      styles: {
        root: {
          color: 'grey'
        }
      }
    };
  }

  enableRunButton() {
    this.runButtonDisabled = false;
    this.runButtonStyle = {
      root: { cursor: "default" }
    };
    this.runIcon = { iconName: 'Play' };
  }

  serializeQueryParams(obj) {
    var str = [];
    for (var p in obj)
      if (obj.hasOwnProperty(p) && obj[p] !== undefined) {
        str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
      }
    return str.join("&");
  }

  // markCodeLinesInEditor(compilerTraces: CompilationTraceOutputDetails[]) {
  //   if (!!this._monacoEditor) {
  //     if (compilerTraces == null) {
  //       //Clear off all code decorations/underlines
  //       this._oldCodeDecorations = this._monacoEditor.deltaDecorations(this._oldCodeDecorations, []);
  //     }
  //     else {
  //       let newDecorations = [];
  //       compilerTraces.forEach(traceEntry => {
  //         if (this.isCompilationTraceClickable(traceEntry)) {
  //           let underLineColor = '';
  //           if (traceEntry.severity == HealthStatus.Critical) underLineColor = 'codeUnderlineError';
  //           if (traceEntry.severity == HealthStatus.Warning) underLineColor = 'codeUnderlineWarning';
  //           if (traceEntry.severity == HealthStatus.Info) underLineColor = 'codeUnderlineInfo';
  //           if (traceEntry.severity == HealthStatus.Success) underLineColor = 'codeUnderlineSuccess';

  //           newDecorations.push({
  //             range: new monaco.Range(traceEntry.location.start.linePos + 1, traceEntry.location.start.colPos + 1, traceEntry.location.end.linePos + 1, traceEntry.location.end.colPos + 1),
  //             options: {
  //               isWholeLine: false,
  //               inlineClassName: `codeUnderline ${underLineColor}`,
  //               hoverMessage: [{
  //                 value: traceEntry.message,
  //                 isTrusted: true,
  //               } as monaco.IMarkdownString]
  //             }
  //           } as monaco.editor.IModelDeltaDecoration);
  //         }
  //       });
  //       if (newDecorations.length > 0) {
  //         this._oldCodeDecorations = this._monacoEditor.deltaDecorations(this._oldCodeDecorations, newDecorations);
  //       }
  //     }
  //   }
  // }

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
