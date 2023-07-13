import {TestBed} from '@angular/core/testing';

import {CommunicationService} from './communication.service';

describe('CommunicationService', () => {
  let service: CommunicationService<any>;
  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CommunicationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });


});


