import {Cell} from "../../domain/Cell";
import {Identifier} from "../../../Identifier";
import {waitForAsync} from "@angular/core/testing";
import {CrdtTable} from "./CrdtTable";

describe('CRDT Table', () => {
  let table: CrdtTable<Cell>;
  let idGenerator: Identifier;

  beforeEach(waitForAsync(() => {
    idGenerator = new Identifier('test');
    let rows = [idGenerator.next(), idGenerator.next(), idGenerator.next()];
    let columns = [idGenerator.next(), idGenerator.next(), idGenerator.next()];
    table = new CrdtTable<Cell>();
    rows.forEach(row => table.addRow(row));
    columns.forEach(column => table.addColumn(column));
  }));


  it('addRow', () => {
    let expected = 'addRow';
    let before = table.rows[1];
    table.insertRow(expected, before);
    let rows = table.rows;
    expect(rows.length).toEqual(4);
    expect(rows[1]).toEqual(expected);
    expect(rows[2]).toEqual(before);
  });
});
