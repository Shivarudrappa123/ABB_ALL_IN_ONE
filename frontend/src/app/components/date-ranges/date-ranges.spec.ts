import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DateRanges } from './date-ranges';

describe('DateRanges', () => {
  let component: DateRanges;
  let fixture: ComponentFixture<DateRanges>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DateRanges]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DateRanges);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
