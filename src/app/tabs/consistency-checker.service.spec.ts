import {TestBed} from '@angular/core/testing';

import {ConsistencyCheckerService} from './consistency-checker.service';
import {Cell} from "../spreadsheet/domain/Cell";
import {Table} from "../spreadsheet/domain/Table";

describe('ConsistencyCheckerService', () => {
  let service: ConsistencyCheckerService;
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
    service.subscribe(identifier, new Table<Cell>(), (time) => {
      expect(time).toBeDefined();
      expect(time).toBeGreaterThan(0);
      stopped = true;
    });
    service.modifiedState();
    expect(stopped).toBeFalse();
    service.updateApplied(new Table<Cell>());
    expect(stopped).toBeTrue();
  });

  it('two nodes', () => {
    let remoteId = 'remote';
    service.addNodes(remoteId);
    localStorage.setItem(remoteId, JSON.stringify(new Table<Cell>()));
    let stopped = false;
    service.subscribe(identifier,new Table<Cell>(), (time) => {
      expect(time).toBeDefined();
      expect(time).toBeGreaterThan(0);
      stopped = true;
    });
    service.modifiedState();
    service.updateApplied(new Table<Cell>());
    expect(stopped).toBeTrue();
  });

});
