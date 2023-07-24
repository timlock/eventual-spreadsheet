import * as Y from 'yjs'
import {Address} from "../../spreadsheet/domain/Address";


export class CrdtTable<T> {
  private readonly ydoc = new Y.Doc;
  private readonly _cells: Y.Map<Y.Map<T>> = this.ydoc.getMap('cells');
  private readonly _columns: Y.Array<string> = this.ydoc.getArray('columns');
  private readonly _rows: Y.Array<string> = this.ydoc.getArray('rows');
  private readonly _keepRows: Y.Map<number> = this.ydoc.getMap('keepRows');
  private readonly _keepColumns: Y.Map<number> = this.ydoc.getMap('keepColumns');

  public addRow(id: string): Uint8Array | undefined {
    this._rows.push([id]);
    this._keepRows.set(id, this.ydoc.clientID);
    return Y.encodeStateAsUpdateV2(this.ydoc);
  }

  public insertRow(id: string, before: string): Uint8Array | undefined {
    let index = this.rows.indexOf(before);
    if (index == -1) {
      console.log("Failed to insert id:" + id + " before id: " + before + " in rows: " + this._rows);
      return undefined;
    }
    this._rows.insert(index, [id]);
    this._keepRows.set(id, this.ydoc.clientID);
    return Y.encodeStateAsUpdateV2(this.ydoc);
  }


  public deleteRow(id: string): Uint8Array | undefined {
    let index = this.rows.indexOf(id);
    if (index == -1) {
      console.log("Failed to remove id:" + id + " in rows: " + this._rows);
      return;
    }
    if (this._keepRows.has(id)) {
      this._keepRows.delete(id);
    }
    return Y.encodeStateAsUpdateV2(this.ydoc);
  }

  public addColumn(id: string): Uint8Array | undefined {
    this._columns.push([id]);
    this._keepColumns.set(id, this.ydoc.clientID);
    return Y.encodeStateAsUpdateV2(this.ydoc);
  }


  public insertColumn(id: string, column: string): Uint8Array | undefined {
    let index = this.columns.indexOf(column);
    if (index == -1) {
      console.log("Failed to insert id:" + id + " before id: " + column + " in columns: " + this._columns);
      return;
    }
    this._columns.insert(index, [id]);
    this._keepColumns.set(id, this.ydoc.clientID);
    return Y.encodeStateAsUpdateV2(this.ydoc);
  }

  public deleteColumn(id: string): Uint8Array | undefined {
    let index = this.columns.indexOf(id);
    if (index == -1) {
      console.log("Failed to remove id:" + id + " in columns: " + this._columns);
      return;
    }
    if (this._keepColumns.has(id)) {
      this._keepColumns.delete(id);
    }
    return Y.encodeStateAsUpdateV2(this.ydoc);
  }


  public deleteValue(columnId: string, rowId: string): Uint8Array | undefined {
    this._cells.get(rowId)?.delete(columnId);
    return Y.encodeStateAsUpdateV2(this.ydoc);
  }

  public get(address: Address): T | undefined {
    return this._cells.get(address.row)?.get(address.column);
  }

  public set(address: Address, value: T): Uint8Array | undefined {
    let row = this._cells.get(address.row)
    if (row === undefined) {
      row = new Y.Map<T>();
      row.set(address.column, value);
      this._cells.set(address.row, row);
    } else {
      row.set(address.column, value);
    }
    this._keepRows.set(address.row, this.ydoc.clientID);
    this._keepColumns.set(address.column, this.ydoc.clientID);
    return Y.encodeStateAsUpdateV2(this.ydoc);
  }

  public getCellRange(range: [Address, Address]): T[] {
    return this.getAddressRange(range)
      .filter(a => this._cells.get(a.row)?.get(a.column) != undefined)
      .map(a => this._cells.get(a.row)!.get(a.column)!);
  }

  public getAddressRange(range: [Address, Address]): Address[] {
    let beginCol = this.columns.indexOf(range[0].column);
    let beginRow = this.rows.indexOf(range[0].row);
    let endCol = this.columns.indexOf(range[1].column);
    let endRow = this.rows.indexOf(range[1].row);
    if (beginCol == -1 || beginRow == -1 || endCol == -1 || endRow == -1) {
      return [];
    }
    let rowIds = this.rows.slice(beginRow, endRow + 1);
    let colIds = this.columns.slice(beginCol, endCol + 1);
    let result: Address[] = [];
    for (const r of rowIds) {
      for (const c of colIds) {
        result.push({column: c, row: r});
      }
    }
    return result;
  }

  public applyUpdate(update: Uint8Array) {
    Y.applyUpdate(this.ydoc, update, this);
  }

  public encodeStateAsUpdate(): Uint8Array | undefined {
    return Y.encodeStateAsUpdateV2(this.ydoc);
  }

  get rows(): string[] {
    return this._rows.toArray().filter(row => this._keepRows.get(row) !== undefined);
  }

  get columns(): string[] {
    return this._columns.toArray().filter(row => this._keepColumns.get(row) !== undefined);
  }


  get keepRows(): Y.Map<number> {
    return this._keepRows;
  }

  get keepColumns(): Y.Map<number> {
    return this._keepColumns;
  }

  get yjsId(): number {
    return this.ydoc.clientID;
  }
}
