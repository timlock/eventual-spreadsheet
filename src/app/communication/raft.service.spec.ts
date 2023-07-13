import { TestBed } from '@angular/core/testing';

import { RaftService } from './raft.service';

describe('RaftService', () => {
  let service: RaftService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RaftService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
