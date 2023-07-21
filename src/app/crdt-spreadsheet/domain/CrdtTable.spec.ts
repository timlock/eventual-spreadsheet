import {Identifier} from "../../Identifier";
import {waitForAsync} from "@angular/core/testing";
import {CrdtTable} from "./CrdtTable";
import {Cell} from "../../spreadsheet/domain/Cell";
import {Address} from "../../spreadsheet/domain/Address";


describe('CRDT Table', () => {
  let table: CrdtTable<Cell>;
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
    let expected: Cell = {rawInput: '1', content: 1};
    let address: Address = {column: columns[0], row: rows[0]};
    table.set(address, expected);
    let actual = table.get(address);
    expect(actual).toBeDefined();
    expect(actual).toEqual(expected);
    expected = {rawInput: '2', content: 2};
    address = {column: columns[1], row: rows[0]}
    table.set(address, expected);
    actual = table.get(address);
    expect(actual).toBeDefined();
    expect(actual).toEqual(expected);
  });
});
