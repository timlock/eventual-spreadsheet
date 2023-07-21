import { TestBed } from '@angular/core/testing';

import { CrdtSpreadsheetService } from './crdt-spreadsheet.service';

describe('CrdtSpeadsheetService', () => {
  let service: CrdtSpreadsheetService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CrdtSpreadsheetService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
