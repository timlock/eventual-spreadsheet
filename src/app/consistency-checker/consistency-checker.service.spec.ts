import {TestBed} from '@angular/core/testing';

import {ConsistencyCheckerService} from './consistency-checker.service';
import {Table} from "../spreadsheet/domain/Table";
import {OutputCell} from "../spreadsheet/domain/OutputCell";

describe('ConsistencyCheckerService', () => {
  let service: ConsistencyCheckerService<OutputCell>;
  let identifier = 'ConsistencyCheckerService';

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ConsistencyCheckerService);
  });

  afterEach(() => {
    service.unsubscribe();
    localStorage.clear();
  });

  it('single node', () => {
    let stopped = false;
    service.subscribe(identifier, new Table(), (time) => {
      expect(time).toBeDefined();
      stopped = true;
    });
    service.submittedState();
    expect(stopped).toBeFalse();
    service.updateApplied(new Table());
    expect(stopped).toBeTrue();
  });

  it('two nodes', () => {
    let remoteId = 'remote';
    service.addNodes(remoteId);
    service.persist(new Table(), remoteId);
    let stopped = false;
    service.subscribe(identifier,new Table(), (time) => {
      expect(time).toBeDefined();
      stopped = true;
    });
    service.submittedState();
    service.updateApplied(new Table());
    expect(stopped).toBeTrue();
  });

});
