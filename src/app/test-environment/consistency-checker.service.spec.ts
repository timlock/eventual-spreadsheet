import {TestBed} from '@angular/core/testing';

import {ConsistencyCheckerService} from "./consistency-checker.service";

describe('ConsistencyCheckerService', () => {
  let service: ConsistencyCheckerService<any>;
  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ConsistencyCheckerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });




});
