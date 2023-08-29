import {Table} from "../spreadsheet/domain/Table";
import {OutputCell} from "../spreadsheet/domain/OutputCell";
import {NgZone} from "@angular/core";
import {Address} from "../spreadsheet/domain/Address";
import {CommunicationServiceObserver} from "../communication/controller/CommunicationServiceObserver";
import {ConsistencyCheckerService} from "../consistency-checker/consistency-checker.service";
import {Communication} from "./Communication";




export abstract class SpreadsheetPage<T> implements CommunicationServiceObserver<T> {
  private _currentCell: OutputCell | undefined;
  private _input = '';
  protected nodes: Set<string> = new Set<string>();
  private _receivedMessageCounter = 0;
  private _sentMessageCounter = 0;
  private _trackedTime: number | undefined;
  protected growQuantity: number = 0;
  protected modifiedState: boolean = false;

  protected constructor(
    protected ngZone: NgZone,
    private consistencyChecker: ConsistencyCheckerService<OutputCell>,
    protected communication: Communication<T>
  ) {
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

  public abstract renderTable(): Table<OutputCell>;

  protected abstract handleMessage(message: T): void;


  public startTimeMeasuring() {
    this.consistencyChecker.subscribe(this.communication.identifier.uuid, this.renderTable(), (time: number) => {
      this.ngZone.run(() => this._trackedTime = time);
    });
  }

  get currentCell(): OutputCell | undefined {
    return this._currentCell;
  }

  protected set currentCell(value: OutputCell | undefined) {
    this._currentCell = value;
  }

  protected performAction(action: () => T | undefined) {
    if (this.communication.isConnected) {
      this.consistencyChecker.submittedState();
      this.modifiedState = false;
    } else {
      this.modifiedState = true;
    }
    this.ngZone.run(() => this._trackedTime = undefined);
    const update = action();
    this.consistencyChecker.updateApplied(this.renderTable());
    if (update === undefined) {
      console.warn('Update is undefined');
      return;
    }
    this.communication.send(update);
    if (this.renderTable().rows.length === 1 && this.renderTable().columns.length === 1) {
      this.selectCell(this.renderTable().columns[0], this.renderTable().rows[0])
    } else if (this.renderTable().rows.length === 0 || this.renderTable().columns.length === 0) {
      this.currentCell = undefined;
    }
  }

  public clear() {
    for (let column of this.renderTable().columns) {
      for (let row of this.renderTable().rows) {
        this.deleteCell({column: column, row: row});
      }
    }
    const rows = Array.from(this.renderTable().rows);
    for (let row of rows) {
      this.deleteRow(row);
    }
    const columns = Array.from(this.renderTable().columns);
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
    for (let column of this.renderTable().columns) {
      for (let row of this.renderTable().rows) {
        counter++;
        this.insertCell({column: column, row: row}, counter + '');
      }
    }
  }


  public onMessage(message: T): void {
    this.consistencyChecker.submittedState();
    this.handleMessage(message);
    this.consistencyChecker.updateApplied(this.renderTable());
    this.ngZone.run(() => {
    });
  }


  public onMessageCounterUpdate(received: number, total: number): void {
    this.ngZone.run(() => {
      this._receivedMessageCounter = received;
      this._sentMessageCounter = total;
    });
  }

  public onNode(nodeId: string): void {
    this.ngZone.run(() => this.nodes.add(nodeId));
    this.consistencyChecker.addNodes(nodeId);
  }

  public changeConnectionState(enabled: boolean) {
    if (enabled && this.modifiedState) {
      this.consistencyChecker.submittedState();
      this.modifiedState = false;
    }
    this.communication.isConnected = enabled;
  }

  public get totalBytes(): number {
    return this.communication.totalBytes;
  }

  public get isConnected(): boolean {
    return this.communication.isConnected;
  }

  public set isConnected(enabled: boolean) {
    this.changeConnectionState(enabled);
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


  get input(): string {
    return this._input;
  }

  set input(value: string) {
    this._input = value;
  }
}
