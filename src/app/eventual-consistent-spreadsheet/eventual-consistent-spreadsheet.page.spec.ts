import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
import { EventualConsistentSpreadsheetPage } from './eventual-consistent-spreadsheet.page';

describe('EventualConsistentSpreadsheetPage', () => {
  let component: EventualConsistentSpreadsheetPage;
  let fixture: ComponentFixture<EventualConsistentSpreadsheetPage>;

  beforeEach(waitForAsync(() => {
    fixture = TestBed.createComponent(EventualConsistentSpreadsheetPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
