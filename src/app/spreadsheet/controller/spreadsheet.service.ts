import {Injectable} from '@angular/core';
import {CellDto} from "./CellDto";
import {CellParser} from "../util/CellParser";
import {Cell} from "../domain/Cell";
import {Address} from "../domain/Address";
import {Table} from "../domain/Table";
import {SpreadsheetSolver} from "./SpreadsheetSolver";

@Injectable({
  providedIn: 'root'
})
export class SpreadsheetService {
  private table: Table<Cell> = new Table();
  private spreadsheetSolver: SpreadsheetSolver = new SpreadsheetSolver(this.table);

  public constructor() {
    this.fillTable();
  }

  private fillTable() {
    let counter = 0;
    let tag = 'init';
    for (let i = 0; i < 10; i++) {
      this.addRow(tag + counter++);
      this.addColumn(tag + counter++);
    }
    this.spreadsheetSolver.reset();
  }


  public addRow(id: string) {
    this.table.addRow(id);
    this.spreadsheetSolver.reset();
  }

  public insertRow(id: string, row: string) {
    this.table.insertRow(id, row);
    this.spreadsheetSolver.reset();
  }

  public deleteRow(id: string) {
    this.table.deleteRow(id);
    this.spreadsheetSolver.reset();
  }

  public addColumn(id: string) {
    this.table.addColumn(id);
    this.spreadsheetSolver.reset();
  }

  public insertColumn(id: string, column: string) {
    this.table.insertColumn(id, column);
    this.spreadsheetSolver.reset();
  }

  public deleteColumn(id: string) {
    this.table.deleteColumn(id);
    this.spreadsheetSolver.reset();
  }

  public insertCellById(address: Address, input: string) {
    if (input.trim().length === 0) {
      this.deleteCell(address);
    } else {
      let cell = CellParser.parseCell(input);
      this.table.set(address, cell);
    }
    this.spreadsheetSolver.reset();
  }

  public deleteCell(address: Address) {
    this.table.deleteValue(address);
    this.spreadsheetSolver.reset();
  }

  public getTable(): Table<Cell> {
    return this.spreadsheetSolver.solve();
  }

  public getCellById(address: Address): CellDto {
    let cell = this.getTable().get(address);
    let colIndex = this.columns.indexOf(address.column) + 1;
    let rowIndex = this.rows.indexOf(address.row) + 1;
    if (cell === undefined) {
      return new CellDto(address, colIndex, rowIndex, '');
    }
    return new CellDto(address, colIndex, rowIndex, cell.rawInput);
  }

  public getCellByIndex(columnIndex: number, rowIndex: number): CellDto {
    let column = this.columns[columnIndex - 1];
    let row = this.rows[rowIndex - 1];
    return this.getCellById({column: column, row: row});
  }

  get rows(): string[] {
    return this.table.rows;
  }

  get columns(): string[] {
    return this.table.columns;
  }

}
