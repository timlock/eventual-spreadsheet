import {Identifier} from "../../Identifier";
import {waitForAsync} from "@angular/core/testing";
import {CrdtTable} from "./CrdtTable";
import {Address} from "../../spreadsheet/domain/Address";


describe('CRDT Table', () => {
  let table: CrdtTable<number>;
  let idGenerator: Identifier;
  let rows: string[];
  let columns: string[];

  beforeEach(waitForAsync(() => {
    idGenerator = new Identifier('test');
    rows = [idGenerator.next(), idGenerator.next(), idGenerator.next()];
    columns = [idGenerator.next(), idGenerator.next(), idGenerator.next()];
    table = new CrdtTable();
    rows.forEach(row => table.addRow(row));
    columns.forEach(column => table.addColumn(column));
  }));


  it('addRow', () => {
    let expected = 'addRow';
    let before = rows[1];
    table.insertRow(expected, before);
    expect(table.rows.length).toEqual(4);
    expect(table.rows[1]).toEqual(expected);
    expect(table.rows[2]).toEqual(before);
  });

  it('set', () => {
    let expected = 1;
    let address: Address = {column: columns[0], row: rows[0]};
    table.set(address, expected);
    let actual = table.get(address);
    expect(actual).toBeDefined();
    expect(actual).toEqual(expected);
    expected = 2;
    address = {column: columns[1], row: rows[0]}
    table.set(address, expected);
    actual = table.get(address);
    expect(actual).toBeDefined();
    expect(actual).toEqual(expected);
  });

  it('concurrent removeColumn and insertCell', () => {
    let remoteTable: CrdtTable<number> = new CrdtTable();
    let update = table.getEncodedState()!;
    remoteTable.applyUpdate(update);
    let address: Address = {column: table.columns[1], row: table.rows[0]};
    update = table.set(address, 1)!;
    let remoteUpdate = remoteTable.deleteColumn(address.column)!;
    table.applyUpdate(remoteUpdate);
    remoteTable.applyUpdate(update);
    expect(table.get(address)).toBeDefined();
    expect(remoteTable.get(address)).toBeDefined();
    expect(table.columns.length).toEqual(3);
    expect(remoteTable.columns.length).toEqual(3);
  });
});

export function logState(name: string, table: CrdtTable<number>) {
  console.log(name, ' rows: ', table.rows, ' columns: ', table.columns, ' keepRows: ', table.keepRows, ' keepColumns: ', table.keepColumns);
}
