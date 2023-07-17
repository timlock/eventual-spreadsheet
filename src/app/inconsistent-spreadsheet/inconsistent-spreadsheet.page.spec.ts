import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
import { InconsistentSpreadsheetPage } from './inconsistent-spreadsheet.page';

describe('InconsistentSpreadsheetPage', () => {
  let component: InconsistentSpreadsheetPage;
  let fixture: ComponentFixture<InconsistentSpreadsheetPage>;

  beforeEach(waitForAsync(() => {
    fixture = TestBed.createComponent(InconsistentSpreadsheetPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
