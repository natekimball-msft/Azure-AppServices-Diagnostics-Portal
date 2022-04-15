import { Component, OnInit, Input, Output, EventEmitter, ElementRef, ViewChild } from '@angular/core';
import { fromEvent } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, map } from 'rxjs/operators';

@Component({
  selector: 'search-box',
  templateUrl: './search-box.component.html',
  styleUrls: ['./search-box.component.scss']
})
export class SearchBoxComponent implements OnInit {

  @Output() searchValueChange: EventEmitter<string> = new EventEmitter<string>();

  @Input()
  set searchValue(val: string) {
    this.searchValueChange.emit(val);
  }

  @ViewChild('searchInput', { static: true }) searchInput: ElementRef;
  constructor() {}
  ngOnInit()
  {
    fromEvent(this.searchInput.nativeElement, 'keyup').pipe(

        // get value
        map((event: any) => {
          return event.target.value;
        })
        // if character length greater then 2
        , filter(res => res.length > 2)

        // Time in milliseconds between key events
        , debounceTime(1000)

        // If previous query is diffent from current
        , distinctUntilChanged()

        // subscription for response
      ).subscribe((text: string) => {

        console.log('res', text);

        // this.searchGetCall(text).subscribe((res) => {
        //   console.log('res', res);
        //   this.isSearching = false;
        //   this.apiResponse = res;
        // }, (err) => {
        //   this.isSearching = false;
        //   console.log('error', err);
        // });

      });
  };
}
