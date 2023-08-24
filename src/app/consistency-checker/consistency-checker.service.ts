import {Injectable} from '@angular/core';
import {Table} from "../spreadsheet/domain/Table";
import {Cell} from "../spreadsheet/domain/Cell";

@Injectable({
  providedIn: 'root'
})
export class ConsistencyCheckerService {
  private id: string = '';
  private callback: ((time: number) => void) | undefined;
  private nodes: string[] = [];
  private totalUpdates = 0;
  private start: number | undefined;

  public subscribe(id: string, initialTable: Table<Cell>, callback: (time: number) => void) {
    this.unsubscribe();
    this.id = id;
    this.callback = callback;
    this.persist(initialTable);
    window.onstorage = (event) => {
      if (event.key === null
        || event.key === this.id
        || event.newValue === null
        || this.start === undefined
        || this.callback === undefined) {
        return;
      }
      let possibleDuration = Date.now() - this.start;
      if (this.reachedConsistentState()) {
        this.start = undefined;
        this.callback(possibleDuration);
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
    let myEntry = localStorage.getItem(this.id);
    if (myEntry === undefined) {
      return false;
    }
    let stateList = this.nodes.map(nodeId => localStorage.getItem(nodeId));
    return stateList.every(other => myEntry === other);
  }


  public submittedState() {
    if (this.start === undefined) {
      this.start = Date.now();
    }
  }

  public updateApplied(newTable: Table<Cell>) {
    this.persist(newTable);
    if (this.start !== undefined && this.callback !== undefined) {
      let possibleDuration = Date.now() - this.start;
      if (this.reachedConsistentState()) {
        this.start = undefined;
        this.callback(possibleDuration);
      }
    }
  }

  public persist(entry: Table<Cell>, id = this.id) {
    let value: Entry = {rows: entry.rows, columns: entry.columns, cells: Array.from(entry.cells.entries())}
    localStorage.setItem(id, JSON.stringify(value));
  }

}

interface Entry {
  rows: string[],
  columns: string[],
  cells: [string, Cell][]
}
