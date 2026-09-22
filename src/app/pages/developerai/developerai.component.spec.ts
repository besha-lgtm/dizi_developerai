import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeveloperaiComponent } from './developerai.component';

describe('DeveloperaiComponent', () => {
  let component: DeveloperaiComponent;
  let fixture: ComponentFixture<DeveloperaiComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DeveloperaiComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DeveloperaiComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
