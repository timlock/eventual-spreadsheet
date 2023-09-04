import { TestBed } from '@angular/core/testing';

import { RaftSpreadsheetService } from './raft-spreadsheet.service';

describe('RaftSpreadsheetServiceService', () => {
  let service: RaftSpreadsheetService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RaftSpreadsheetService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
