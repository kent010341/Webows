import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkdayCalculator } from './workday-calculator';

describe('WorkdayCalculator', () => {
  let component: WorkdayCalculator;
  let fixture: ComponentFixture<WorkdayCalculator>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkdayCalculator]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WorkdayCalculator);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
