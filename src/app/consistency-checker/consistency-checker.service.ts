import {Injectable} from '@angular/core';
import {Table} from "../spreadsheet/domain/Table";


@Injectable({
  providedIn: 'root'
})
export class ConsistencyCheckerService<T> {
  private id = '';
  private currentState = '';
  private lastConsistentState: string = '';
  private callback: (() => void) | undefined;
  private nodes: Map<string, string> = new Map();
  private _isConsistent = false;

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
      this.nodes.set(event.key, event.newValue);
      if (this.reachedConsistentState()) {
        const currentState = localStorage.getItem(this.id) || '';
        if (currentState !== this.lastConsistentState) {
          this.lastConsistentState = currentState
          this._isConsistent = true;
          this.callback();
        }
      } else {
        this._isConsistent = false;
      }
    };
  }

  public unsubscribe() {
    localStorage.removeItem(this.id);
    window.onstorage = null;
    this.callback = undefined;
  }

  public addNodes(...nodes: string[]) {
    for (const node of nodes) {
      if (this.nodes.get(node) === undefined) {
        const state = localStorage.getItem(node) || '';
        this.nodes.set(node, state);
      }
    }
  }

  public reachedConsistentState(): boolean {
    for (const node of this.nodes) {
      if (node[1] !== this.currentState) {
        return false;
      }
    }
    return true;
  }

  public update(state: Table<T>) {
    const value: Entry<T> = {rows: state.rows, columns: state.columns, cells: Array.from(state.cells.entries())};
    const entry = JSON.stringify(value);
    if (entry !== this.currentState) {
      try {
        localStorage.setItem(this.id, entry);
        this.currentState = entry;
      } catch (e) {
        console.error('Localstorage exceeds size limit and will be cleared');
        localStorage.clear();
      }
    }
    // if (this.nodes.size === 0 && this.callback !== undefined) {
    //   this.callback();
    // }
  }


  get isConsistent(): boolean {
    return this._isConsistent;
  }
}

interface Entry<T> {
  rows: string[],
  columns: string[],
  cells: [string, T][]
}
