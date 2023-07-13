import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConsistentSpreadsheetPage } from './consistent-spreadsheet.page';

describe('ConsistentSpreadsheetPage', () => {
  let component: ConsistentSpreadsheetPage;
  let fixture: ComponentFixture<ConsistentSpreadsheetPage>;

  beforeEach(async(() => {
    fixture = TestBed.createComponent(ConsistentSpreadsheetPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
