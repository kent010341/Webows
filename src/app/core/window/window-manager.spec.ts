import { TestBed } from '@angular/core/testing';

import { WindowManager } from './window-manager';

describe('WindowManager', () => {
  let service: WindowManager;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WindowManager);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
