import {Address} from "./Address";
import {Spreadsheet} from "../controller/Spreadsheet";

export class Table<T> implements Spreadsheet<T> {
  private readonly _rows: string[] = [];
  private readonly _columns: string[] = [];
  private readonly _cells: Map<string, T> = new Map();

  public addRow(id: string) {
    this._rows.push(id);
  }

  public insertRow(id: string, row: string) {
    const index = this._rows.indexOf(row);
    if (index ===-1) {
      console.log("Failed to insert id:" + id + " before id: " + row + " in rows: " + this._rows);
      return;
    }
    this._rows.splice(index, 0, id);
  }

  public deleteRow(id: string) {
    const index = this._rows.indexOf(id);
    if (index ===-1) {
      console.log("Failed to remove id:" + id + " in rows: " + this._rows);
      return;
    }
    this._rows.splice(index, 1);
  }

  public addColumn(id: string) {
    this._columns.push(id);
  }

  public insertColumn(id: string, column: string) {
    const index = this._columns.indexOf(column);
    if (index ===-1) {
      console.log("Failed to insert id:" + id + " before id: " + column + " in columns: " + this._columns);
      return;
    }
    this._columns.splice(index, 0, id);
  }

  public deleteColumn(id: string) {
    const index = this._columns.indexOf(id);
    if (index ===-1) {
      console.log("Failed to remove id:" + id + " in columns: " + this._columns);
      return;
    }
    this._columns.splice(index, 1);
  }


  public deleteValue(address: Address) {
    this._cells.delete(JSON.stringify(address));
  }

  public get(address: Address): T | undefined {
    return this._cells.get(JSON.stringify(address));
  }

  public set(address: Address, value: T) {
    this._cells.set(JSON.stringify(address), value);
  }

  public getCellRange(begin: Address, end: Address): T[] {
    return this.getAddressRange(begin, end)
      .filter(a => this.get(a) != undefined)
      .map(a => this.get(a)!);
  }

  public getAddressRange(begin: Address, end: Address): Address[] {
    const beginCol = this._columns.indexOf(begin.column);
    const beginRow = this._rows.indexOf(begin.row);
    const endCol = this._columns.indexOf(end.column);
    const endRow = this._rows.indexOf(end.row);
    if (beginCol ===-1 || beginRow ===-1 || endCol ===-1 || endRow ===-1) {
      return [];
    }
    const rowIds = this._rows.slice(beginRow, endRow + 1);
    const colIds = this._columns.slice(beginCol, endCol + 1);
    const result: Address[] = [];
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


  get cells(): Map<string, T> {
    return this._cells;
  }
}
