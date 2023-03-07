import { TestBed } from '@angular/core/testing';

import { DevopsserviceService } from './devopsservice.service';

describe('DevopsserviceService', () => {
  let service: DevopsserviceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DevopsserviceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
