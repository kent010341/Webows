import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AppIcon } from './app-icon';

describe('AppIcon', () => {
  let component: AppIcon;
  let fixture: ComponentFixture<AppIcon>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppIcon]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AppIcon);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
