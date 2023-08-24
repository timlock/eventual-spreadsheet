import * as Y from 'yjs'
import {Address} from "../../spreadsheet/domain/Address";
import {Spreadsheet} from "../../spreadsheet/controller/Spreadsheet";


export class CrdtTable<T> implements Spreadsheet<T> {
  private readonly ydoc = new Y.Doc();
  private readonly _cells: Y.Map<T> = this.ydoc.getMap('cells');
  private readonly _columns: Y.Array<string> = this.ydoc.getArray('columns');
  private readonly _rows: Y.Array<string> = this.ydoc.getArray('rows');
  private readonly _keepRows: Y.Map<number> = this.ydoc.getMap('keepRows');
  private readonly _keepColumns: Y.Map<number> = this.ydoc.getMap('keepColumns');
  private static UPDATE_MODE = 'updateV2';

  private catchUpdate(action: () => void): Uint8Array {
    const updates: Uint8Array[] = [];
    this.ydoc.on(CrdtTable.UPDATE_MODE, (update: Uint8Array) => {
      updates.push(update);
    });
    action();
    this.ydoc.off(CrdtTable.UPDATE_MODE, () => {
    });
    return Y.mergeUpdatesV2(updates);
  }

  public addRow(id: string): Uint8Array {
    return this.catchUpdate(() => {
      this._rows.push([id]);
      this._keepRows.set(id, this.ydoc.clientID)
    })
  }

  public insertRow(id: string, before: string): Uint8Array | undefined {
    const index = this.rows.indexOf(before);
    if (index ===-1) {
      console.log("Failed to insert id:" + id + " before id: " + before + " in rows: " + this.rows);
      return undefined;
    }
    return this.catchUpdate(() => {
      this._rows.insert(index, [id]);
      this._keepRows.set(id, this.ydoc.clientID);
    });
  }


  public deleteRow(id: string): Uint8Array | undefined {
    const index = this.rows.indexOf(id);
    if (index ===-1) {
      console.log("Failed to remove id:" + id + " in rows: " + this.rows);
      return undefined;
    }
    if (this._keepRows.has(id)) {
      return this.catchUpdate(() => {
        this._keepRows.delete(id);
      });
    }
    return undefined;
  }

  public addColumn(id: string): Uint8Array {
    return this.catchUpdate(() => {
      this._columns.push([id]);
      this._keepColumns.set(id, this.ydoc.clientID);
    });
  }


  public insertColumn(id: string, column: string): Uint8Array | undefined {
    const index = this.columns.indexOf(column);
    if (index ===-1) {
      console.log("Failed to insert id:" + id + " before id: " + column + " in columns: " + this.columns);
      return undefined;
    }
    return this.catchUpdate(() => {
      this._columns.insert(index, [id]);
      this._keepColumns.set(id, this.ydoc.clientID);
    });
  }

  public deleteColumn(id: string): Uint8Array | undefined {
    const index = this.columns.indexOf(id);
    if (index ===-1) {
      console.log("Failed to remove id:" + id + " in columns: " + this.columns);
      return;
    }
    if (this._keepColumns.has(id)) {
      return this.catchUpdate(() => {
        this._keepColumns.delete(id);
      });
    }
    return undefined;
  }


  public deleteValue(address: Address): Uint8Array {
    return this.catchUpdate(() => {
      this._cells.delete(JSON.stringify(address));
    });
  }

  public get(address: Address): T | undefined {
    return this._cells.get(JSON.stringify(address));
  }

  public set(address: Address, value: T): Uint8Array | undefined {
    return this.catchUpdate(() => {
      this._cells.set(JSON.stringify(address), value);
      this._keepRows.set(address.row, this.ydoc.clientID);
      this._keepColumns.set(address.column, this.ydoc.clientID);
    });
  }

  public getCellRange(begin: Address, end: Address): T[] {
    return this.getAddressRange(begin, end)
      .filter(a => this.get(a) != undefined)
      .map(a => this.get(a)!);
  }

  public getAddressRange(begin: Address, end: Address): Address[] {
    const beginCol = this.columns.indexOf(begin.column);
    const beginRow = this.rows.indexOf(begin.row);
    const endCol = this.columns.indexOf(end.column);
    const endRow = this.rows.indexOf(end.row);
    if (beginCol ===-1 || beginRow ===-1 || endCol ===-1 || endRow ===-1) {
      return [];
    }
    const rowIds = this.rows.slice(beginRow, endRow + 1);
    const colIds = this.columns.slice(beginCol, endCol + 1);
    const result: Address[] = [];
    for (const r of rowIds) {
      for (const c of colIds) {
        result.push({column: c, row: r});
      }
    }
    return result;
  }

  public applyUpdate(update: Uint8Array) {
    Y.applyUpdateV2(this.ydoc, update, this);
  }

  public encodeStateAsUpdate(encodedStateVector?: Uint8Array): Uint8Array | undefined {
    return Y.encodeStateAsUpdateV2(this.ydoc, encodedStateVector);
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
