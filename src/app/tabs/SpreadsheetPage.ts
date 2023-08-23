import {Table} from "../spreadsheet/domain/Table";
import {Cell} from "../spreadsheet/domain/Cell";
import {CellDto} from "../spreadsheet/controller/CellDto";
import {NgZone} from "@angular/core";
import {Identifier} from "../identifier/Identifier";
import {Address} from "../spreadsheet/domain/Address";
import {CommunicationServiceObserver} from "../communication/controller/CommunicationServiceObserver";
import {ConsistencyCheckerService} from "../consistency-checker/consistency-checker.service";
import {Communication} from "./Communication";

export abstract class SpreadsheetPage<T> implements CommunicationServiceObserver<T> {
  protected _currentCell: CellDto | undefined;
  protected _nodes: Set<string> = new Set<string>();
  private _receivedMessageCounter = 0;
  private _sentMessageCounter = 0;
  private _trackedTime: number | undefined;
  protected _growQuantity: number = 0;
  protected modifiedState: boolean = false;

  protected constructor(
    protected ngZone: NgZone,
    protected consistencyChecker: ConsistencyCheckerService,
    protected communication: Communication<T>
  ) {

  }

  get currentCell(): CellDto {
    if (this.table.rows.indexOf(this._currentCell!.row) === -1 || this.table.columns.indexOf(this._currentCell!.column) === -1) {
      this.selectCell(this.table.columns[0], this.table.rows[0]);
    }
    return this._currentCell!;
  }

  public abstract selectCell(colId: string, rowId: string): void ;

  public abstract addRow(): void;

  public abstract insertRow(row: string): void;

  public abstract deleteRow(row: string): void;

  public abstract addColumn(): void;

  public abstract insertColumn(column: string): void;

  public abstract deleteColumn(column: string): void;

  public abstract insertCell(address: Address, input: string): void;

  public abstract deleteCell(address: Address): void;

  protected performAction(action: () => T | undefined) {
    if (this.communication.isConnected) {
      this.consistencyChecker.submittedState();
      this.modifiedState = false;
    } else {
      this.modifiedState = true;
    }
    this.ngZone.run(() => this._trackedTime = undefined);
    let update = action();
    this.consistencyChecker.updateApplied(this.table);
    if (update === undefined) {
      console.warn('Update is undefined');
      return;
    }
    this.communication.send(update);
  }

  public clear() {
    for (let column of this.table.columns) {
      for (let row of this.table.rows) {
        this.deleteCell({column: column, row: row});
      }
    }
    let rows = Array.from(this.table.rows);
    for (let row of rows) {
      this.deleteRow(row);
    }
    let columns = Array.from(this.table.columns);
    for (let column of columns) {
      this.deleteColumn(column);
    }
  }

  public grow(quantity: number) {
    console.log('Grow', quantity)
    for (let i = 0; i < quantity; i++) {
      this.addColumn();
      this.addRow();
    }
  }

  public fillTable() {
    let counter = 0;
    for (let column of this.table.columns) {
      for (let row of this.table.rows) {
        counter++;
        console.log(counter, column, row)
        this.insertCell({column: column, row: row}, counter + '');
      }
    }
  }


  public onMessage(message: T): void {
    this.consistencyChecker.submittedState();
    this.handleMessage(message);
    this.consistencyChecker.updateApplied(this.table);
    this.ngZone.run(() => {
    });
  }

  protected abstract handleMessage(message: T): void;

  public onMessageCounterUpdate(received: number, total: number): void {
    console.log(received, total)
    this.ngZone.run(() => {
      this._receivedMessageCounter = received;
      this._sentMessageCounter = total;
    });
  }

  public onNode(nodeId: string): void {
    this.ngZone.run(() => this._nodes.add(nodeId));
    this.consistencyChecker.addNodes(nodeId);
  }

  public changeConnectionState(enabled: boolean) {
    if (enabled && this.modifiedState) {
      this.consistencyChecker.submittedState();
      this.modifiedState = false;
    }
    this.communication.isConnected = enabled;
  }


  get receivedMessageCounter(): number {
    return this._receivedMessageCounter;
  }

  get sentMessageCounter(): number {
    return this._sentMessageCounter;
  }

  get trackedTime(): number | undefined {
    return this._trackedTime;
  }

  set trackedTime(value: number | undefined) {
    this._trackedTime = value;
  }

  get identifier(): Identifier {
    return this.communication.identifier;
  }

  get isConnected(): boolean {
    return this.communication.isConnected;
  }

  set isConnected(enabled: boolean) {
    this.changeConnectionState(enabled);
  }

  abstract get table(): Table<Cell>;

  get nodes(): Set<string> {
    return this._nodes;
  }


  get growQuantity(): number {
    return this._growQuantity;
  }

  set growQuantity(value: number) {
    this._growQuantity = value;
  }
}
