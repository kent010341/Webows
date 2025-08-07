import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditAndGo } from './edit-and-go';

describe('EditAndGo', () => {
  let component: EditAndGo;
  let fixture: ComponentFixture<EditAndGo>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditAndGo]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditAndGo);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
