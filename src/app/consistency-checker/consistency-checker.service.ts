import {Injectable} from '@angular/core';
import {Table} from "../spreadsheet/domain/Table";

@Injectable({
  providedIn: 'root'
})
export class ConsistencyCheckerService<T> {
  private id: string = '';
  private callback: (() => void) | undefined;
  private nodes: string[] = [];
  private totalUpdates = 0;

  public subscribe(id: string, initialTable: Table<T>, callback: () => void) {
    this.unsubscribe();
    this.id = id;
    this.callback = callback;
    this.update(initialTable);
    window.onstorage = (event) => {
      if (event.key === null
        || event.key === this.id
        || event.newValue === null
        || this.callback === undefined) {
        return;
      }
      this.totalUpdates++;
      if (this.reachedConsistentState()) {
        this.callback();
      }
    };
  }

  public unsubscribe() {
    localStorage.removeItem(this.id);
    this.totalUpdates = 0;
  }

  public addNodes(...nodes: string[]) {
    for (const node of nodes) {
      if (this.nodes.indexOf(node) === -1) {
        this.nodes.push(node);
      }
    }
  }


  public reachedConsistentState(): boolean {
    const myEntry = localStorage.getItem(this.id);
    if (myEntry === undefined) {
      return false;
    }
    const stateList = this.nodes.map(nodeId => localStorage.getItem(nodeId));
    return stateList.every(other => myEntry === other);
  }

  public update(entry: Table<T>, id = this.id) {
    const value: Entry<T> = {rows: entry.rows, columns: entry.columns, cells: Array.from(entry.cells.entries())}
    localStorage.setItem(id, JSON.stringify(value));
    // if(this.reachedConsistentState() && this.callback !== undefined){
    //   this.callback();
    // }
  }

}

interface Entry<T> {
  rows: string[],
  columns: string[],
  cells: [string, T][]
}
