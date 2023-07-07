import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CpuMonitoringRuleComponent } from './cpu-monitoring-rule.component';

describe('CpuMonitoringRuleComponent', () => {
  let component: CpuMonitoringRuleComponent;
  let fixture: ComponentFixture<CpuMonitoringRuleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CpuMonitoringRuleComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CpuMonitoringRuleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
