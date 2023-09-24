import {TestBed, waitForAsync} from '@angular/core/testing';

import {SpreadsheetService} from './spreadsheet.service';
import {Identifier} from "../../identifier/Identifier";
import {OutputCell} from "../domain/OutputCell";
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
    let expected: OutputCell = {address: address, columnIndex: 1, rowIndex: 1, input: '1', content: 1};
    table.set(address, expected.input);
    table.renderTable();
    let actualDto = table.renderTable().get(address);
    expect(actualDto).toBeDefined();
    expect(actualDto).toEqual(expected);
  });


  it('add row', () => {
    let rowId = idGenerator.next();
    let oldLength = table.rows.length;
    table.addRow(rowId);
    let actual = table.renderTable();
    expect(actual.rows.length).toEqual(oldLength + 1);
    expect(table.rows[oldLength]).toEqual(rowId);
  });

  it('delete row', () => {
    let rowId = table.rows[0];
    let oldLength = table.rows.length;
    table.deleteRow(rowId);
    let actual = table.renderTable();
    expect(actual.rows.length).toEqual(oldLength - 1);
    expect(actual.rows[0]).not.toEqual(rowId);
  });

  it('add formula vertical', () => {
    let firstAddress: Address = {column: table.columns[0], row: table.rows[0]};
    let secondAddress: Address = {column: table.columns[0], row: table.rows[1]};
    let firstCell: OutputCell = {address: firstAddress, columnIndex: 1, rowIndex: 1, input: '2', content: 2};
    let secondCell: OutputCell = {address: secondAddress, columnIndex: 1, rowIndex: 2, input: '2', content: 2};
    let range = firstCell.address.column + '|' + firstCell.address.row + ':' + secondCell.address.column + '|' + secondCell.address.row;
    let rawFormula = '=SUM(' + range + ')';
    let formulaAddress: Address = {column: table.columns[0], row: table.rows[2]};
    let formula: OutputCell = {address: formulaAddress, columnIndex: 1, rowIndex: 3, input: rawFormula, content: 4};
    table.set(firstCell.address, firstCell.input);
    table.set(secondCell.address, secondCell.input);
    table.set(formula.address, formula.input);
    let actualRenderedCell = table.renderTable().get(formula.address);
    expect(actualRenderedCell).toBeDefined();
    expect(actualRenderedCell!.content).toEqual(4);
  });

  it('add formula horizontal', () => {
    let firstAddress: Address = {column: table.columns[0], row: table.rows[0]};
    let secondAddress: Address = {column: table.columns[1], row: table.rows[0]};
    let firstCell: OutputCell = {address: firstAddress, columnIndex: 1, rowIndex: 1, input: '2', content: 2};
    let secondCell: OutputCell = {address: secondAddress, columnIndex: 2, rowIndex: 1, input: '2', content: 2};
    let range = firstCell.address.column + '|' + firstCell.address.row + ':' + secondCell.address.column + '|' + secondCell.address.row;
    let rawFormula = '=SUM(' + range + ')';
    let formulaAddress: Address = {column: table.columns[2], row: table.rows[0]};
    let formula: OutputCell = {address: formulaAddress, columnIndex: 3, rowIndex: 1, input: rawFormula, content: 4};
    table.set(firstCell.address, firstCell.input);
    table.set(secondCell.address, secondCell.input);
    table.set(formula.address, formula.input);
    let actualRenderedCell = table.renderTable().get(formula.address);
    expect(actualRenderedCell).toBeDefined();
    expect(actualRenderedCell!.content).toEqual(4);
  });

  it('add formula over formula', () => {
    let firstAddress: Address = {column: table.columns[0], row: table.rows[1]};
    let secondAddress: Address = {column: table.columns[1], row: table.rows[1]};
    let firstCell: OutputCell = {address: firstAddress, columnIndex: 1, rowIndex: 2, input: '2', content: 2};
    let secondCell: OutputCell = {address: secondAddress, columnIndex: 2, rowIndex: 2, input: '2', content: 2};
    let range = firstCell.address.column + '|' + firstCell.address.row + ':' + secondCell.address.column + '|' + secondCell.address.row;
    let rawFormula = '=SUM(' + range + ')';
    let firstFormulaAddress: Address = {column: table.columns[2], row: table.rows[1]};
    let firstFormula: OutputCell = {address: firstFormulaAddress, columnIndex: 3, rowIndex: 2, input: rawFormula, content: 4};
    range = firstFormula.address.column + '|' + firstFormula.address.row + ':' + firstFormula.address.column + '|' + firstFormula.address.row;
    rawFormula = '=SUM(' + range + ')';
    let secondFormulaAddress: Address = {column: table.columns[0], row: table.rows[0]};
    let secondFormula: OutputCell = {address: secondFormulaAddress, columnIndex: 1, rowIndex: 1, input: rawFormula, content: 4};
    table.set(firstCell.address, firstCell.input);
    table.set(secondCell.address, secondCell.input);
    table.set(secondFormula.address, secondFormula.input);
    table.set(firstFormula.address, firstFormula.input);
    let actual = table.renderTable().get(secondFormula.address);
    expect(actual).toBeDefined();
    expect(actual?.content).toEqual(4);
  });

  it('resolve self referencing formula', () => {
    let address: Address = {column: table.columns[0], row: table.rows[0]};
    let rawFormula = '=SUM(' + address.column + '|' + address.row + ':' + address.column + '|' + address.row + ')';
    let formulaAddress: Address = {column: table.columns[0], row: table.rows[0]};
    let formula: OutputCell = {address: formulaAddress, columnIndex: 1, rowIndex: 1, input: rawFormula, content: 0};
    table.set(formula.address, formula.input);
    let actual = table.renderTable().get(address);
    expect(actual).toBeDefined();
    expect(actual?.content).toEqual(0);
  });

  it('resolve formula cycle', () => {
    let address: Address = {column: table.columns[0], row: table.rows[1]};
    let rawFormula = '=SUM(' + address.column + '|' + address.row + ':' + address.column + '|' + address.row + ')';
    let firstFormulaAddress: Address = {column: table.columns[0], row: table.rows[0]};
    let firstFormula: OutputCell = {address: firstFormulaAddress, columnIndex: 3, rowIndex: 2, input: rawFormula, content: 0};
    rawFormula = '=SUM(' + firstFormula.address.column + '|' + address.row + ':' + firstFormula.address.column + '|' + address.row + ')';
    let secondFormula: OutputCell = {address: address, columnIndex: 1, rowIndex: 2, input: rawFormula, content: 0};
    table.set(firstFormula.address, firstFormula.input);
    table.set(secondFormula.address, secondFormula.input);
    let actual = table.renderTable().get(address);
    expect(actual).toBeDefined();
    expect(actual?.content).toEqual(0);
  });
});
