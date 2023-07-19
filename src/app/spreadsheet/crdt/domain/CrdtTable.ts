import * as Y from 'yjs'
import {Address} from "../../domain/Address";

export class CrdtTable<T> {
  private readonly ydoc = new Y.Doc;
  private readonly _cells: Y.Map<Y.Map<T>> = this.ydoc.getMap('cells');
  private readonly _columns: Y.Array<string> = this.ydoc.getArray('columns');
  private readonly _rows: Y.Array<string> = this.ydoc.getArray('rows');
  // private readonly keepRows: Y.Map<Y.Map<string>> = this.ydoc.getMap('keepRows');
  // private readonly keepColumns: Y.Map<Y.Map<string>> = this.ydoc.getMap('keepColumns');
  // private readonly undoRows: Y.UndoManager = new Y.UndoManager(this._rows);
  // private readonly undoColumns: Y.UndoManager = new Y.UndoManager(this._columns);

  constructor() {
    // this.keepRows.observe(event => {
    //   if(event.transaction.origin){
    //     this.keepRows.forEach((operations, id) => {
    //       if(this.rows.indexOf(id) < 0){
    //         this.undoRows.undo();
    //       }
    //     })
    //   }
    // });
    // this.keepColumns.observe(event => {
    //   if(event.transaction.origin){
    //     this.keepColumns.forEach((operations, id) => {
    //       if(this.columns.indexOf(id) < 0){
    //         this.undoColumns.undo();
    //       }
    //     })
    //   }
    // });
  }

  public addRow(id: string): Uint8Array | undefined {
    this._rows.push([id]);
    return Y.encodeStateAsUpdate(this.ydoc);
  }

  public insertRow(id: string, before: string): Uint8Array | undefined {
    let index = this.rows.indexOf(before);
    if (index == -1) {
      console.log("Failed to insert id:" + id + " before id: " + before + " in rows: " + this._rows);
      return undefined;
    }
    this._rows.insert(index, [id]);
    // let keepEntry: Y.Map<string> = new Y.Map();
    // keepEntry.set(id, id);
    // this.keepRows.set(id, keepEntry);
    return Y.encodeStateAsUpdate(this.ydoc);
  }


  public deleteRow(id: string): Uint8Array | undefined {
    let index = this.rows.indexOf(id);
    if (index == -1) {
      console.log("Failed to remove id:" + id + " in rows: " + this._rows);
      return;
    }
    this._rows.delete(index, 1);
    return Y.encodeStateAsUpdate(this.ydoc);
  }

  public addColumn(id: string): Uint8Array | undefined {
    this._columns.push([id]);
    return Y.encodeStateAsUpdate(this.ydoc);
  }


  public insertColumn(id: string, column: string): Uint8Array | undefined {
    let index = this.columns.indexOf(column);
    if (index == -1) {
      console.log("Failed to insert id:" + id + " before id: " + column + " in columns: " + this._columns);
      return;
    }
    this._columns.insert(index, [id]);
    return Y.encodeStateAsUpdate(this.ydoc);
  }

  public deleteColumn(id: string): Uint8Array | undefined {
    let index = this.columns.indexOf(id);
    if (index == -1) {
      console.log("Failed to remove id:" + id + " in columns: " + this._columns);
      return;
    }
    this._columns.delete(index, 1);
    return Y.encodeStateAsUpdate(this.ydoc);
  }


  public deleteValue(columnId: string, rowId: string): Uint8Array | undefined {
    this._cells.get(rowId)?.delete(columnId);
    return Y.encodeStateAsUpdate(this.ydoc);
  }

  public get(address: Address): T | undefined {
    return this._cells.get(address.row)?.get(address.column);
  }

  public set(address: Address, value: T): Uint8Array | undefined {
    let row = this._cells.get(address.row) || new Y.Map();
    row.set(address.column, value);
    this._cells.set(address.row, row);
    return Y.encodeStateAsUpdate(this.ydoc);
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
    let rowIds = this._rows.slice(beginRow, endRow + 1);
    let colIds = this._columns.slice(beginCol, endCol + 1);
    let result: Address[] = [];
    for (const r of rowIds) {
      for (const c of colIds) {
        result.push(new Address(c, r));
      }
    }
    return result;
  }

  get rows(): string[] {
    return this._rows.toArray()
  }

  get columns(): string[] {
    return this._columns.toArray();
  }

  public applyUpdate(update: Uint8Array) {
    Y.applyUpdate(this.ydoc, update, this);
  }

  public getEncodedState(): Uint8Array | undefined {
    return Y.encodeStateAsUpdate(this.ydoc);
  }
}
