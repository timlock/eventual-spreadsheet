import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
import { ConsistentSpreadsheetPage } from './consistent-spreadsheet.page';

describe('ConsistentSpreadsheetPage', () => {
  let component: ConsistentSpreadsheetPage;
  let fixture: ComponentFixture<ConsistentSpreadsheetPage>;

  beforeEach(waitForAsync(() => {
    fixture = TestBed.createComponent(ConsistentSpreadsheetPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
