import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EventualConsistentSpreadsheetPage } from './eventual-consistent-spreadsheet.page';

describe('EventualConsistentSpreadsheetPage', () => {
  let component: EventualConsistentSpreadsheetPage;
  let fixture: ComponentFixture<EventualConsistentSpreadsheetPage>;

  beforeEach(async(() => {
    fixture = TestBed.createComponent(EventualConsistentSpreadsheetPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
