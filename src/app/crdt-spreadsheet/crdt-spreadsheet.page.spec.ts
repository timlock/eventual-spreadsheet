import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
import { CrdtSpreadsheetPage } from './crdt-spreadsheet.page';

describe('CrdtSpreadsheetPage', () => {
  let component: CrdtSpreadsheetPage;
  let fixture: ComponentFixture<CrdtSpreadsheetPage>;

  beforeEach(waitForAsync(() => {
    fixture = TestBed.createComponent(CrdtSpreadsheetPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
