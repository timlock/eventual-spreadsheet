import * as Y from 'yjs'
import {Address} from "../../spreadsheet/domain/Address";
import {Solvable} from "../../spreadsheet/controller/Solvable";


export class CrdtTable<T> implements Solvable<T> {
  private readonly ydoc = new Y.Doc();
  private readonly _cells: Y.Map<T> = this.ydoc.getMap('cells');
  private readonly _columns: Y.Array<string> = this.ydoc.getArray('columns');
  private readonly _rows: Y.Array<string> = this.ydoc.getArray('rows');
  private readonly keepRows: Y.Map<number> = this.ydoc.getMap('keepRows');
  private readonly keepColumns: Y.Map<number> = this.ydoc.getMap('keepColumns');
  private cachedRows: string[] = [];
  private cachedColumns: string[] = [];
  private static readonly UPDATE_V2: string = 'updateV2';
  private static readonly UPDATE_V1: string = 'update';
  private static readonly UPDATE_MODE = CrdtTable.UPDATE_V1;


  private catchUpdate(action: () => void): Uint8Array | undefined {
    const updates: Uint8Array[] = [];
    this.ydoc.on(CrdtTable.UPDATE_MODE, (update: Uint8Array) => {
      updates.push(update);
    });
    action();
    this.ydoc.off(CrdtTable.UPDATE_MODE, () => {
    });
    const merged = CrdtTable.UPDATE_MODE === CrdtTable.UPDATE_V2 ? Y.mergeUpdatesV2(updates) : Y.mergeUpdates(updates)
    if (merged.length === 0) {
      return undefined;
    }
    return merged;
  }

  public applyUpdate(update: Uint8Array) {
    if (CrdtTable.UPDATE_MODE === CrdtTable.UPDATE_V2) {
      Y.applyUpdateV2(this.ydoc, update, this);
    } else {
      Y.applyUpdate(this.ydoc, update, this);
    }
    this.cachedRows = this._rows.toArray().filter(row => this.keepRows.get(row) !== undefined);
    this.cachedColumns = this._columns.toArray().filter(row => this.keepColumns.get(row) !== undefined);
  }

  public encodeStateAsUpdate(encodedStateVector?: Uint8Array): Uint8Array | undefined {
    if (CrdtTable.UPDATE_MODE === CrdtTable.UPDATE_V2) {
      return Y.encodeStateAsUpdateV2(this.ydoc, encodedStateVector);
    }
    return Y.encodeStateAsUpdate(this.ydoc, encodedStateVector);
  }

  public addRow(id: string): Uint8Array | undefined {
    return this.catchUpdate(() => {
      this._rows.push([id]);
      this.keepRows.set(id, this.ydoc.clientID);
      this.cachedRows.push(id);
    })
  }

  public insertRow(id: string, before: string): Uint8Array | undefined {
    const index = this.rows.indexOf(before);
    if (index === -1) {
      console.log("Failed to insert id:" + id + " before id: " + before + " in rows: " + this.rows);
      return undefined;
    }
    return this.catchUpdate(() => {
      this._rows.insert(index, [id]);
      this.keepRows.set(id, this.ydoc.clientID);
      this.cachedRows.splice(index, 0, id);
    });
  }


  public deleteRow(id: string): Uint8Array | undefined {
    const index = this.rows.indexOf(id);
    if (index === -1) {
      console.log("Failed to remove id:" + id + " in rows: " + this.rows);
      return undefined;
    }
    if (this.keepRows.has(id)) {
      return this.catchUpdate(() => {
        this.keepRows.delete(id);
        this.cachedRows.splice(index, 1);
      });
    }
    return undefined;
  }

  public addColumn(id: string): Uint8Array | undefined {
    return this.catchUpdate(() => {
      this._columns.push([id]);
      this.keepColumns.set(id, this.ydoc.clientID);
      this.cachedColumns.push(id);
    });
  }


  public insertColumn(id: string, column: string): Uint8Array | undefined {
    const index = this.columns.indexOf(column);
    if (index === -1) {
      console.log("Failed to insert id:" + id + " before id: " + column + " in columns: " + this.columns);
      return undefined;
    }
    return this.catchUpdate(() => {
      this._columns.insert(index, [id]);
      this.keepColumns.set(id, this.ydoc.clientID);
      this.cachedColumns.splice(index, 0, id);
    });
  }

  public deleteColumn(id: string): Uint8Array | undefined {
    const index = this.columns.indexOf(id);
    if (index === -1) {
      console.log("Failed to remove id:" + id + " in columns: " + this.columns);
      return;
    }
    if (this.keepColumns.has(id)) {
      return this.catchUpdate(() => {
        this.keepColumns.delete(id);
        this.cachedColumns.splice(index,1);
      });
    }
    return undefined;
  }


  public deleteValue(address: Address): Uint8Array | undefined {
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
      this.keepRows.set(address.row, this.ydoc.clientID);
      this.keepColumns.set(address.column, this.ydoc.clientID);
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
    if (beginCol === -1 || beginRow === -1 || endCol === -1 || endRow === -1) {
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

  get rows(): string[] {
    // return this._rows.toArray().filter(row => this.keepRows.get(row) !== undefined);
    return this.cachedRows
  }

  get columns(): string[] {
    // return this._columns.toArray().filter(row => this.keepColumns.get(row) !== undefined);
    return this.cachedColumns;
  }


  get yjsId(): number {
    return this.ydoc.clientID;
  }
}
