import {ServerState} from "./ServerState";

describe('ServerState', () => {

  it('isUpToDate success', () => {
    let serverState = new ServerState([{content: 'isUpToDate success', term: 2}]);
    let actual = serverState.isUpToDate(1, 2);
    expect(actual).toBeTrue();
  });
  it('isUpToDate failure', () => {
    let serverState = new ServerState([{content: 'isUpToDate failure', term: 2}]);
    let actual = serverState.isUpToDate(1, 1);
    expect(actual).toBeFalse();
  });

  it('isUpToDate no logs', () => {
    let serverState = new ServerState();
    let actual = serverState.isUpToDate(0, undefined);
    expect(actual).toBeTrue();
  });
  it('higher term', () => {
    let serverState = new ServerState([{content: 1, term: 2}, {content: 2, term: 2}, {content: 3, term: 2}]);
    let actual = serverState.isUpToDate(1,3);
    expect(actual).toBeTrue();
  });
  it('same term higher index', () => {
    let serverState = new ServerState([{content: 1, term: 2}, {content: 2, term: 2}, {content: 3, term: 2}]);
    let actual = serverState.isUpToDate(4,2);
    expect(actual).toBeTrue();
  });
  it('same term lower index', () => {
    let serverState = new ServerState([{content: 1, term: 2}, {content: 2, term: 2}, {content: 3, term: 2}]);
    let actual = serverState.isUpToDate(2,2);
    expect(actual).toBeFalse();
  });

});
