import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Taskbar } from './taskbar';

describe('Taskbar', () => {
  let component: Taskbar;
  let fixture: ComponentFixture<Taskbar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Taskbar]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Taskbar);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
