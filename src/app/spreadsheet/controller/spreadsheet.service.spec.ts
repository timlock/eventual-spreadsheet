import {TestBed, waitForAsync} from '@angular/core/testing';

import {SpreadsheetService} from './spreadsheet.service';
import {Identifier} from "../../Identifier";
import {CellDto} from "./CellDto";
import {Address} from "../domain/Address";

describe('SpreadsheetService', () => {
  let table: SpreadsheetService;
  let idGenerator: Identifier;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({});
    table = TestBed.inject(SpreadsheetService);
    idGenerator = new Identifier('test');
  }));


  it('insert value', () => {
    let address: Address = {column: table.columns[0], row: table.rows[0]};
    let expected = new CellDto(address, '1');
    table.insertCell(expected);
    table.renderTable();
    let actualDto = table.getCellById(address);
    expect(actualDto).toBeDefined();
    expect(actualDto).toEqual(expected);
  });


  it('add row', () => {
    let rowId = idGenerator.next();
    table.addRow(rowId);
    let actual = table.renderTable();
    expect(actual.rows.length).toEqual(4);
    expect(table.rows[3]).toEqual(rowId);
  });

  it('delete row', () => {
    let rowId = table.rows[0];
    table.deleteRow(rowId);
    let actual = table.renderTable();
    expect(actual.rows.length).toEqual(2);
    expect(actual.rows[0]).not.toEqual(rowId);
  });

  it('add formula vertical', () => {
    let firstAddress: Address = {column: table.columns[0], row: table.rows[0]};
    let secondAddress: Address = {column: table.columns[0], row: table.rows[1]};
    let firstCell = new CellDto(firstAddress, '2');
    let secondCell = new CellDto(secondAddress, '2');
    let range = firstCell.column + '|' + firstCell.row + ':' + secondCell.column + '|' + secondCell.row;
    let rawFormula = '=SUM(' + range + ')';
    let formula = new CellDto({column: table.columns[0], row: table.rows[2]}, rawFormula);
    table.insertCell(firstCell);
    table.insertCell(secondCell);
    table.insertCell(formula);
    let actualRenderedCell = table.renderTable().get(formula.address);
    expect(actualRenderedCell).toBeDefined();
    expect(actualRenderedCell!.content).toEqual(4);
  });

  it('add formula horizontal', () => {
    let firstAddress: Address = {column: table.columns[0], row: table.rows[0]};
    let secondAddress: Address = {column: table.columns[1], row: table.rows[0]};
    let firstCell = new CellDto(firstAddress, '2');
    let secondCell = new CellDto(secondAddress, '2');
    let range = firstCell.column + '|' + firstCell.row + ':' + secondCell.column + '|' + secondCell.row;
    let rawFormula = '=SUM(' + range + ')';
    let formula = new CellDto({column: table.columns[2], row: table.rows[0]}, rawFormula);
    table.insertCell(firstCell);
    table.insertCell(secondCell);
    table.insertCell(formula);
    let actualRenderedCell = table.renderTable().get(formula.address);
    expect(actualRenderedCell).toBeDefined();
    expect(actualRenderedCell!.content).toEqual(4);
  });

  it('add formula over formula', () => {
    let firstCell = new CellDto({column: table.columns[0], row: table.rows[1]}, '2');
    let secondCell = new CellDto({column: table.columns[1], row: table.rows[1]}, '2');
    let range = firstCell.address.toString() + ':' + secondCell.address.toString();
    let rawFormula = '=SUM(' + range + ')';
    let firstFormula = new CellDto({column: table.columns[2], row: table.rows[1]}, rawFormula);
    range = firstFormula.address.toString() + ':' + firstFormula.address.toString();
    rawFormula = '=SUM(' + range + ')';
    let secondFormula = new CellDto({column: table.columns[0], row: table.rows[0]}, rawFormula);
    table.insertCell(firstCell);
    table.insertCell(secondCell);
    table.insertCell(secondFormula);
    table.insertCell(firstFormula);
    let actual = table.renderTable().get(secondFormula.address);
    expect(actual).toBeDefined();
    expect(actual!.content).toEqual(4);
  });

  it('resolve self referencing formula', () => {
    let address: Address = {column: table.columns[0], row: table.rows[0]};
    let rawFormula = '=SUM(' + address.toString() + ':' + address.toString() + ')';
    let firstFormula = new CellDto({column: table.columns[0], row: table.rows[0]}, rawFormula);
    table.insertCell(firstFormula);
    let actual = table.renderTable().get(address);
    expect(actual).toBeDefined();
    expect(actual?.content).toEqual(0);
  });

  it('resolve small formula cycle', () => {
    let address: Address = {column: table.columns[0], row: table.rows[1]};
    let rawFormula = '=SUM(' + address.toString() + ':' + address.toString() + ')';
    let firstFormula = new CellDto({column: table.columns[0], row: table.rows[0]}, rawFormula);
    rawFormula = '=SUM(' + firstFormula.address.toString() + ':' + firstFormula.address.toString() + ')';
    let secondFormula = new CellDto(address, rawFormula);
    table.insertCell(firstFormula);
    table.insertCell(secondFormula);
    let actual = table.renderTable().get(address);
    expect(actual).toBeDefined();
    expect(actual?.content).toEqual(0);
  });
});
