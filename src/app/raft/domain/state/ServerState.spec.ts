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

});
