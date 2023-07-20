import {Cell} from "../../domain/Cell";
import {Identifier} from "../../../Identifier";
import {waitForAsync} from "@angular/core/testing";
import {CrdtTable} from "./CrdtTable";
import {Address} from "../../domain/Address";


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
    let expected = new Cell('1', 1);
    let address = Address.of(columns[0], rows[0]);
    table.set(address, expected);
    let actual = table.get(address);
    expect(actual).toBeDefined();
    expect(actual).toEqual(expected);
  });
});
