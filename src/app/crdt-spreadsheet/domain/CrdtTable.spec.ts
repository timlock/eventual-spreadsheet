import {Identifier} from "../../Identifier";
import {waitForAsync} from "@angular/core/testing";
import {CrdtTable} from "./CrdtTable";
import {Address} from "../../spreadsheet/domain/Address";


describe('CRDT Table', () => {
  let table: CrdtTable<number>;
  let remoteTable: CrdtTable<number>;
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
    remoteTable = new CrdtTable();
    let update = table.encodeStateAsUpdate()!;
    remoteTable.applyUpdate(update);
  }));


  it('addRow', () => {
    let expected = 'addRow';
    let before = rows[1];
    let update = table.insertRow(expected, before)!;
    remoteTable.applyUpdate(update);
    expect(table.rows.length).toEqual(4);
    expect(table.rows[1]).toEqual(expected);
    expect(table.rows[2]).toEqual(before);
    expect(remoteTable.rows.length).toEqual(4);
    expect(remoteTable.rows[1]).toEqual(expected);
    expect(remoteTable.rows[2]).toEqual(before);
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
    let address: Address = {column: table.columns[1], row: table.rows[0]};
    let update = table.set(address, 1);
    let remoteUpdate = remoteTable.deleteColumn(address.column);
    table.applyUpdate(remoteUpdate!);
    remoteTable.applyUpdate(update!);
    expect(table.get(address)).toBeDefined();
    expect(remoteTable.get(address)).toBeDefined();
    expect(table.columns.length).toEqual(3);
    expect(remoteTable.columns.length).toEqual(3);
  });

  it('concurrent insert', () => {
    let address: Address = {column: table.columns[0], row: table.rows[0]};
    let update = table.set(address, 1)!;
    let remoteUpdate = remoteTable.set(address, 2)!;
    table.applyUpdate(remoteUpdate);
    remoteTable.applyUpdate(update);
    if (table.yjsId > remoteTable.yjsId) {
      expect(table.get(address)).toEqual(1);
      expect(remoteTable.get(address)).toEqual(1);
    } else {
      expect(table.get(address)).toEqual(2);
      expect(remoteTable.get(address)).toEqual(2);
    }
  });

  it('concurrent row insert and delete', () => {
    let update = table.insertRow(idGenerator.next(), rows[2]);
    expect(table.rows.length).toEqual(4);
    let remoteUpdate = remoteTable.deleteRow(rows[2]);
    expect(remoteTable.rows.find(value => value === rows[2])).toBeUndefined();
    table.applyUpdate(remoteUpdate!);
    remoteTable.applyUpdate(update!);
    expect(table.rows.length).toEqual(3);
    expect(remoteTable.rows.length).toEqual(3);
    expect(table.rows[2]).toEqual(idGenerator.getLastId());
    expect(remoteTable.rows[2]).toEqual(idGenerator.getLastId());
  });
});
