import {PayloadFactory} from "./PayloadFactory";
import {isPayload} from "./Action";

describe('PayloadFactory', () => {


  it('addRow', () => {
    let insertCell = PayloadFactory.addRow('input');
    let result = isPayload(insertCell);
    expect(result).toBeTrue();
  });


  it('insertRow', () => {
    let insertCell = PayloadFactory.insertRow('1', 'input');
    let result = isPayload(insertCell);
    expect(result).toBeTrue();
  });


  it('deleteRow', () => {
    let insertCell = PayloadFactory.deleteRow('input');
    let result = isPayload(insertCell);
    expect(result).toBeTrue();
  });

  it('addColumn', () => {
    let insertCell = PayloadFactory.addColumn('input');
    let result = isPayload(insertCell);
    expect(result).toBeTrue();
  });


  it('insertColumn', () => {
    let insertCell = PayloadFactory.insertColumn('1', 'input');
    let result = isPayload(insertCell);
    expect(result).toBeTrue();
  });


  it('deleteColumn', () => {
    let insertCell = PayloadFactory.deleteColumn('input');
    let result = isPayload(insertCell);
    expect(result).toBeTrue();
  });

  it('insertCell', () => {
    let insertCell = PayloadFactory.insertCell({column: '1', row: '1'}, 'input');
    let result = isPayload(insertCell);
    expect(result).toBeTrue();
  });


});
