import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InconsistentSpreadsheetPage } from './inconsistent-spreadsheet.page';

describe('InconsistentSpreadsheetPage', () => {
  let component: InconsistentSpreadsheetPage;
  let fixture: ComponentFixture<InconsistentSpreadsheetPage>;

  beforeEach(async(() => {
    fixture = TestBed.createComponent(InconsistentSpreadsheetPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
