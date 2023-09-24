import {Injectable} from '@angular/core';
import {Table} from "../spreadsheet/domain/Table";

@Injectable({
  providedIn: 'root'
})
export class ConsistencyCheckerService<T> {
  private id = '';
  private currentState = '';
  private lastConsistentState: string = '';
  private callback: ((time: number, medianDelay?: number) => void) | undefined;
  private nodes: Map<string, string> = new Map();
  private _isConsistent = false;
  private channel = new BroadcastChannel('consistency-status');
  private messageDelays: number[] = [];

  private calculateMedianMessageDelay(): number | undefined {
    if(this.messageDelays.length === 0){
      return undefined;
    }
    this.messageDelays.sort((a, b) => a - b);
    // const value = this.messageDelays[Math.floor(this.messageDelays.length / 2)];
    const value = this.messageDelays[this.messageDelays.length - Math.floor(((this.messageDelays.length / 10) + 1))];
    // const value = this.messageDelays.reduce((previousValue, currentValue) => previousValue + currentValue) / 2;
    // console.log(nineteenthPercintel, average)
    this.messageDelays = [];
    return value;
  }

  public subscribe(id: string, initialTable: Table<T>, callback: (time: number, medianDelay?: number) => void) {
    this.unsubscribe();
    this.id = id;
    this.callback = callback;
    this.update(initialTable);
    this.channel.onmessage = (ev) => {
      const source = ev.data.source as string;
      const table = ev.data.table as string;
      const time = ev.data.time as number;
      const messageDelay = ev.data.medianDelay as number | undefined;
      if (messageDelay !== undefined){
        this.messageDelays.push(messageDelay);
      }
      this.nodes.set(source, table);
      if (this.reachedConsistentState()) {
        const medianDelay = this.calculateMedianMessageDelay();
        if (this.currentState !== this.lastConsistentState) {
          this.lastConsistentState = this.currentState;
          this._isConsistent = true;
          this.callback!(time, medianDelay);
        }
      } else {
        this._isConsistent = false;
      }
    }
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

  public update(state: Table<T>, medianDelay?: number) {
    const value: Entry<T> = {rows: state.rows, columns: state.columns, cells: Array.from(state.cells.entries())};
    const entry = JSON.stringify(value);
    if (entry !== this.currentState) {
      try {
        this.channel.postMessage({source: this.id, table: entry, time: Date.now(), medianDelay: medianDelay});
        this.currentState = entry;
      } catch (e) {
        console.error('Localstorage exceeds size limit and will be cleared');
        localStorage.clear();
      }
    }
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
