import {Address} from "./Address";
import {Spreadsheet} from "../controller/Spreadsheet";

export class Table<T> implements Spreadsheet<T>{
  private readonly _rows: string[] = [];
  private readonly _columns: string[] = [];
  private readonly _cells: Map<string, Map<string, T>> = new Map();

  public addRow(id: string) {
    this._rows.push(id);
  }

  public insertRow(id: string, row: string) {
    let index = this._rows.indexOf(row);
    if (index == -1) {
      console.log("Failed to insert id:" + id + " before id: " + row + " in rows: " + this._rows);
      return;
    }
    this._rows.splice(index, 0, id);
  }

  public deleteRow(id: string) {
    let index = this._rows.indexOf(id);
    if (index == -1) {
      console.log("Failed to remove id:" + id + " in rows: " + this._rows);
      return;
    }
    this._rows.splice(index, 1);
  }

  public addColumn(id: string) {
    this._columns.push(id);
  }

  public insertColumn(id: string, column: string) {
    let index = this._columns.indexOf(column);
    if (index == -1) {
      console.log("Failed to insert id:" + id + " before id: " + column + " in columns: " + this._columns);
      return;
    }
    this._columns.splice(index, 0, id);
  }

  public deleteColumn(id: string) {
    let index = this._columns.indexOf(id);
    if (index == -1) {
      console.log("Failed to remove id:" + id + " in columns: " + this._columns);
      return;
    }
    this._columns.splice(index, 1);
  }


  public deleteValue(address: Address) {
    this.cells.get(address.row)?.delete(address.column);
  }

  public get(address: Address): T | undefined {
    return this.cells.get(address.row)?.get(address.column);
  }

  public set(address: Address, value: T) {
    let row = this.cells.get(address.row) || new Map();
    row.set(address.column, value);
    this.cells.set(address.row, row);
  }

  public getCellRange(range: [Address, Address]): T[] {
    return this.getAddressRange(range)
      .filter(a => this.cells.get(a.row)?.get(a.column) != undefined)
      .map(a => this.cells.get(a.row)!.get(a.column)!);
  }

  public getAddressRange(range: [Address, Address]): Address[] {
    let beginCol = this._columns.indexOf(range[0].column);
    let beginRow = this._rows.indexOf(range[0].row);
    let endCol = this._columns.indexOf(range[1].column);
    let endRow = this._rows.indexOf(range[1].row);
    if (beginCol == -1 || beginRow == -1 || endCol == -1 || endRow == -1) {
      return [];
    }
    let rowIds = this._rows.slice(beginRow, endRow + 1);
    let colIds = this._columns.slice(beginCol, endCol + 1);
    let result: Address[] = [];
    for (const r of rowIds) {
      for (const c of colIds) {
        result.push({column: c, row: r});
      }
    }
    return result;
  }

  get rows(): string[] {
    return this._rows;
  }

  get columns(): string[] {
    return this._columns;
  }

  get cells(): Map<string, Map<string, T>> {
    return this._cells;
  }
}
