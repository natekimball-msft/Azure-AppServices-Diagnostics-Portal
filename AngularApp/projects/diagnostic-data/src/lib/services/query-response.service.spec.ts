import { TestBed } from '@angular/core/testing';
import { QueryResponseService } from 'diagnostic-data';


describe('QueryResponseService', () => {
  let service: QueryResponseService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(QueryResponseService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
