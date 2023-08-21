import {Injectable} from '@angular/core';
import {CellDto} from "../../spreadsheet/controller/CellDto";
import {CellParser} from "../../spreadsheet/util/CellParser";
import {CrdtTable} from "../domain/CrdtTable";
import {Cell} from "../../spreadsheet/domain/Cell";
import {Address} from "../../spreadsheet/domain/Address";
import {Table} from "../../spreadsheet/domain/Table";
import {SpreadsheetSolver} from "../../spreadsheet/controller/SpreadsheetSolver";

@Injectable({
  providedIn: 'root'
})
export class CrdtSpreadsheetService {
  private table: CrdtTable<Cell> = new CrdtTable();
  private spreadsheetSolver = new SpreadsheetSolver(this.table);

  public applyUpdate(update: Uint8Array) {
    this.table.applyUpdate(update);
    this.spreadsheetSolver.reset();
  }


  public addRow(id: string): Uint8Array | undefined {
    let update = this.table.addRow(id);
    this.spreadsheetSolver.reset();
    return update;
  }

  public insertRow(id: string, row: string): Uint8Array | undefined {
    let update = this.table.insertRow(id, row);
    this.spreadsheetSolver.reset();
    if (update === undefined) {
      console.warn('Update is undefined');
    }
    return update;
  }

  public deleteRow(id: string): Uint8Array | undefined {
    let update = this.table.deleteRow(id);
    this.spreadsheetSolver.reset();
    if (update === undefined) {
      console.warn('Update is undefined');
    }
    return update;
  }

  public addColumn(id: string): Uint8Array | undefined {
    let update = this.table.addColumn(id);
    this.spreadsheetSolver.reset();
    if (update === undefined) {
      console.warn('Update is undefined');
    }
    return update;
  }

  public insertColumn(id: string, column: string): Uint8Array | undefined {
    let update = this.table.insertColumn(id, column);
    this.spreadsheetSolver.reset();
    if (update === undefined) {
      console.warn('Update is undefined');
    }
    return update;
  }

  public deleteColumn(id: string): Uint8Array | undefined {
    let update = this.table.deleteColumn(id);
    this.spreadsheetSolver.reset();
    if (update === undefined) {
      console.warn('Update is undefined');
    }
    return update;
  }

  public insertCellById(address: Address, input: string): Uint8Array | undefined {
    if (input.trim().length === 0) {
      return this.deleteCell(address);
    }
    let cell = CellParser.parseCell(input);
    let update = this.table.set(address, cell);
    this.spreadsheetSolver.reset();
    if (update === undefined) {
      console.warn('Update is undefined');
      return update;
    }
    return update;

  }

  public deleteCell(address: Address): Uint8Array | undefined {
    let update = this.table.deleteValue(address);
    this.spreadsheetSolver.reset();
    if (update === undefined) {
      console.warn('Update is undefined');
      return update;
    }
    return update;
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
    let column = this.columns[columnIndex];
    let row = this.rows[rowIndex];
    return this.getCellById({column: column, row: row});
  }

  public getAddressByIndex(columnIndex: number, rowIndex: number): Address | undefined {
    let column = this.columns[columnIndex];
    let row = this.rows[rowIndex];
    if (column === undefined || row === undefined) {
      return undefined;
    }
    return {column: column, row: row};
  }

  get rows(): string[] {
    return this.table.rows;
  }

  get columns(): string[] {
    return this.table.columns;
  }

  public getEncodedState(encodedStateVector?: Uint8Array): Uint8Array | undefined {
    return this.table.encodeStateAsUpdate(encodedStateVector);
  }
}
