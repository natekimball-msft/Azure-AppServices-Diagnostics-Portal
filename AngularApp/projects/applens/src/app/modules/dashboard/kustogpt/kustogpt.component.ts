import { AdalService } from 'adal-angular4';
import { Component, OnInit } from '@angular/core';
import {DomSanitizer,SafeResourceUrl,} from '@angular/platform-browser';
import { environment } from '../../../../environments/environment';
import { DiagnosticApiService } from "../../../shared/services/diagnostic-api.service";

@Component({
  selector: 'kustogpt',
  templateUrl: './kustogpt.component.html',
  styleUrls: ['./kustogpt.component.scss']
})
export class KustoGPTComponent implements OnInit {
  

  constructor() {
   }

  ngOnInit(): void {
  
  }
}
