import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ApplensGlobal } from '../../../applens-global';
import { applensDocs } from '../../../shared/utilities/applens-docs-constant';
import { ApplensDiagnosticService } from '../services/applens-diagnostic.service';

@Component({
  selector: 'applens-docs',
  templateUrl: './applens-docs.component.html',
  styleUrls: ['./applens-docs.component.scss']
})
export class ApplensDocsComponent implements OnInit {
  applensDocs = applensDocs;
  constructor(private _applensGlobal:ApplensGlobal, private diagnosticApiService: ApplensDiagnosticService, private ref: ChangeDetectorRef) { }
  
  markdownCode = [];
  folders = []

  codeRegEx = new RegExp("<applens-code.*?\/>","g");
  folderRegEx = new RegExp("(?<=folder=\").*?(?=\")", "g");

  htmlToAdd = "";
  fileNames: string[][] = [];

  files: {id: number, file: string}[][] = [];

  // editorTestString: string = "editor test test";
  // editorOptions = {theme: 'vs-dark', language: 'javascript'};
  
  ngOnInit() {
      this._applensGlobal.updateHeader("");

      this.diagnosticApiService.getDetectorCode(`documentation/insight/insightmarkdown.txt`, "darreldonald/documentationTestBranch", "/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/Fake-RG/providers/Microsoft.AzurePortal/sessions/adasdasdasdasd/").subscribe(x=>{
        this.markdownCode = x.split(this.codeRegEx);
        this.folders = this.getCodeFolders(x);
        this.folders.forEach(f => {
          this.getFiles(f);
        });
        for(var i = 0; i < this.markdownCode.length; i++){
          //this.htmlToAdd = this.htmlToAdd.concat(`<markdown ngPreserveWhitespaces [data]="markdownCode[${i}]"></markdown>\n`);
          this.htmlToAdd = this.htmlToAdd.concat(`${this.markdownCode[i]}\n`);
          // if (i < this.folders.length)
          // this.htmlToAdd = this.htmlToAdd.concat(`<p>folder name: ${this.folders[i]}</p>\n`);
        }
        // this.markdownCode.forEach(mdSection => {
        //   this.htmlToAdd = this.htmlToAdd.concat(`<markdown ngPreserveWhitespaces [data]="'${mdSection}'"></markdown>\n`);
        // });
        // folders.forEach(f => {
        //   this.htmlToAdd = this.htmlToAdd.concat(`<p>folder name: ${f}</p>\n`);
        // })
      });
  }
  getCodeFolders(markdown: string){
    
    var folders = [];

    markdown.match(this.codeRegEx).forEach(x => {
      folders.push(x.match(this.folderRegEx)[0]);
    });

    return folders;
  }
  getFiles(folderName: string){
    let fileIndex = this.files.length;
    this.files.push([]);
    this.diagnosticApiService.getDetectorCode(`documentation/insight/${folderName}/content`, "darreldonald/documentationTestBranch", "/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/Fake-RG/providers/Microsoft.AzurePortal/sessions/adasdasdasdasd/").subscribe(names => {
      this.fileNames[fileIndex] = names.split('\n');
      let subIndexer = 0;
      this.fileNames[fileIndex].forEach(f => {
        this.diagnosticApiService.getDetectorCode(`documentation/insight/${folderName}/${f.replace(/\s/g,"")}`, "darreldonald/documentationTestBranch", "/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/Fake-RG/providers/Microsoft.AzurePortal/sessions/adasdasdasdasd/").subscribe(fileContent => {
          this.files[fileIndex].push({id: subIndexer, file: fileContent});
          subIndexer = subIndexer + 1;
          // console.log(caller, fileContent)
        });
      });
    });
  }
}
