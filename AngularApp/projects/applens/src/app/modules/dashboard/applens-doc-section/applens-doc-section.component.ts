import { Component, Input, OnInit } from '@angular/core';
import { inputControlHeight } from '@uifabric/azure-themes/lib/azure/Constants';
import { BehaviorSubject } from 'rxjs';

@Component({
  selector: 'applens-doc-section',
  templateUrl: './applens-doc-section.component.html',
  styleUrls: ['./applens-doc-section.component.scss']
})
export class ApplensDocSectionComponent implements OnInit {
  //codeObservable: BehaviorSubject<string> = new BehaviorSubject("");
  // list<string> name = new list<string>();

  // @Input() set code(s:string){
  //   if(!!s) {
  //     this.codeObservable.next(s);
  //   }
  // }

  @Input() code = "";

  constructor() { }

  ngOnInit() {
    
  }

}
