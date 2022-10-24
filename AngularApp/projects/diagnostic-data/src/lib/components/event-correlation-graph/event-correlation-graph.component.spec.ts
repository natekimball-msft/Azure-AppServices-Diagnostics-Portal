import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EventCorrelationGraphComponent } from './event-correlation-graph.component';

describe('EventCorrelationGraphComponent', () => {
  let component: EventCorrelationGraphComponent;
  let fixture: ComponentFixture<EventCorrelationGraphComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EventCorrelationGraphComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EventCorrelationGraphComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
