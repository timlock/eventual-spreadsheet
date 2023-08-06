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
      if (this.nodes.indexOf(node) == -1) {
        this.nodes.push(node);
      }
    }
  }


  public reachedConsistentState(): boolean {
    let myEntry = this.read(this.id);
    if (myEntry === undefined) {
      return false;
    }
    let stateList = this.nodes.map(nodeId => this.read(nodeId));
    return stateList.every(other => other !== undefined && myEntry?.equals(other));
  }




  public modifiedState() {
    if (this.start === undefined) {
      this.start = Date.now();
    }
  }

  public updateApplied(newTable: Table<Cell>) {
    this.persist(newTable);
    if (this.start === undefined || this.callback === undefined) {
      return;
    }
    let possibleDuration = Date.now() - this.start;
    if (this.reachedConsistentState()) {
      this.start = undefined;
      this.callback(possibleDuration);
    }
  }

  public read(id: string): Table<Cell> | undefined {
    let json = localStorage.getItem(id);
    if (json === null) {
      return undefined;
    }
    let object = JSON.parse(json) as Table<Cell>;
    let placeHolder = new Table<Cell>()
    return Object.assign(placeHolder, object);
  }

  private persist(entry: Table<Cell>) {
    let value = JSON.stringify(entry);
    localStorage.setItem(this.id, value);
  }

}
