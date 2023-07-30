import {TestBed, waitForAsync} from '@angular/core/testing';

import {SpreadsheetService} from './spreadsheet.service';
import {Identifier} from "../../identifier/Identifier";
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
    let expected = new CellDto(address,1,1, '1');
    table.insertCellById(address, expected.input);
    table.getTable();
    let actualDto = table.getCellById(address);
    expect(actualDto).toBeDefined();
    expect(actualDto).toEqual(expected);
  });


  it('add row', () => {
    let rowId = idGenerator.next();
    table.addRow(rowId);
    let actual = table.getTable();
    expect(actual.rows.length).toEqual(4);
    expect(table.rows[3]).toEqual(rowId);
  });

  it('delete row', () => {
    let rowId = table.rows[0];
    table.deleteRow(rowId);
    let actual = table.getTable();
    expect(actual.rows.length).toEqual(2);
    expect(actual.rows[0]).not.toEqual(rowId);
  });

  it('add formula vertical', () => {
    let firstAddress: Address = {column: table.columns[0], row: table.rows[0]};
    let secondAddress: Address = {column: table.columns[0], row: table.rows[1]};
    let firstCell = new CellDto(firstAddress,1,1, '2');
    let secondCell = new CellDto(secondAddress,1,2, '2');
    let range = firstCell.column + '|' + firstCell.row + ':' + secondCell.column + '|' + secondCell.row;
    let rawFormula = '=SUM(' + range + ')';
    let formula = new CellDto({column: table.columns[0], row: table.rows[2]},1,3, rawFormula);
    table.insertCellById(firstCell.address, firstCell.input);
    table.insertCellById(secondCell.address, secondCell.input);
    table.insertCellById(formula.address, formula.input);
    let actualRenderedCell = table.getTable().get(formula.address);
    expect(actualRenderedCell).toBeDefined();
    expect(actualRenderedCell!.content).toEqual(4);
  });

  it('add formula horizontal', () => {
    let firstAddress: Address = {column: table.columns[0], row: table.rows[0]};
    let secondAddress: Address = {column: table.columns[1], row: table.rows[0]};
    let firstCell = new CellDto(firstAddress,1,1, '2');
    let secondCell = new CellDto(secondAddress,2,1, '2');
    let range = firstCell.column + '|' + firstCell.row + ':' + secondCell.column + '|' + secondCell.row;
    let rawFormula = '=SUM(' + range + ')';
    let formula = new CellDto({column: table.columns[2], row: table.rows[0]},3,1, rawFormula);
    table.insertCellById(firstCell.address, firstCell.input);
    table.insertCellById(secondCell.address, secondCell.input);
    table.insertCellById(formula.address, formula.input);
    let actualRenderedCell = table.getTable().get(formula.address);
    expect(actualRenderedCell).toBeDefined();
    expect(actualRenderedCell!.content).toEqual(4);
  });

  it('add formula over formula', () => {
    let firstCell = new CellDto({column: table.columns[0], row: table.rows[1]},1,2, '2');
    let secondCell = new CellDto({column: table.columns[1], row: table.rows[1]},2,2, '2');
    let range = firstCell.address.column + '|' + firstCell.address.row + ':' + secondCell.address.column + '|' + secondCell.address.row;
    let rawFormula = '=SUM(' + range + ')';
    let firstFormula = new CellDto({column: table.columns[2], row: table.rows[1]},3,2, rawFormula);
    range = firstFormula.address.column + '|' + firstFormula.address.row + ':' + firstFormula.address.column + '|' + firstFormula.address.row;
    rawFormula = '=SUM(' + range + ')';
    let secondFormula = new CellDto({column: table.columns[0], row: table.rows[0]},1,1, rawFormula);
    table.insertCellById(firstCell.address, firstCell.input);
    table.insertCellById(secondCell.address, secondCell.input);
    table.insertCellById(secondFormula.address, secondFormula.input);
    table.insertCellById(firstFormula.address, firstFormula.input);
    let actual = table.getTable().get(secondFormula.address);
    expect(actual).toBeDefined();
    expect(actual?.content).toEqual(4);
  });

  it('resolve self referencing formula', () => {
    let address: Address = {column: table.columns[0], row: table.rows[0]};
    let rawFormula = '=SUM(' + address.column + '|' + address.row + ':' + address.column + '|' + address.row + ')';
    let firstFormula = new CellDto({column: table.columns[0], row: table.rows[0]},1,1, rawFormula);
    table.insertCellById(firstFormula.address, firstFormula.input);
    let actual = table.getTable().get(address);
    expect(actual).toBeDefined();
    expect(actual?.content).toEqual(0);
  });

  it('resolve small formula cycle', () => {
    let address: Address = {column: table.columns[0], row: table.rows[1]};
    let rawFormula = '=SUM(' + address.column + '|' + address.row + ':' + address.column + '|' + address.row + ')';
    let firstFormula = new CellDto({column: table.columns[0], row: table.rows[0]},1,1, rawFormula);
    rawFormula = '=SUM(' + firstFormula.address.column + '|' + address.row + ':' + firstFormula.address.column + '|' + address.row + ')';
    let secondFormula = new CellDto(address,1,2, rawFormula);
    table.insertCellById(firstFormula.address, firstFormula.input);
    table.insertCellById(secondFormula.address, secondFormula.input);
    let actual = table.getTable().get(address);
    expect(actual).toBeDefined();
    expect(actual?.content).toEqual(0);
  });
});
