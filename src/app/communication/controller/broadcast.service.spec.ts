import {TestBed} from '@angular/core/testing';

import {BroadcastService} from './broadcast.service';

describe('CommunicationService', () => {
  let service: BroadcastService<any>;
  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BroadcastService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });


});


