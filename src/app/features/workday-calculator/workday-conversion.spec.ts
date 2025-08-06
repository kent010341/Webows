import { TestBed } from '@angular/core/testing';

import { WorkdayConversion } from './workday-conversion';

describe('WorkdayConversion', () => {
  let service: WorkdayConversion;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WorkdayConversion);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
