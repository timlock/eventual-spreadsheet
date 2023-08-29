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
  private _trackedTime = 0;
  private timerStart: number | undefined;
  private byteCounterStart = 0;
  private _countedBytes = 0;
  private messageCounterStart = 0;
  private _countedMessages = 0;
  protected growQuantity = 0;
  protected modifiedState = false;


  protected constructor(
    private consistencyChecker: ConsistencyCheckerService<OutputCell>,
    protected communication: Communication<T>,
    private readonly tag: string
  ) {
  }

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

  private startStopwatch() {
    this.timerStart = Date.now();
    this.byteCounterStart = this.communication.countedBytes;
    this.messageCounterStart = this.communication.countedMessages;
  }

  public startTimeMeasuring() {
    this.consistencyChecker.subscribe(this.communication.identifier.uuid, this.renderTable(), () => {
      if (this.timerStart !== undefined) {
        this._trackedTime = Date.now() - this.timerStart;
        this.timerStart = undefined;
        this._countedBytes = this.communication.countedBytes - this.byteCounterStart
        this._countedMessages = this.communication.countedMessages - this.messageCounterStart;
      }
    });
  }

  public selectCell(column: string, row: string) {
    if (this.renderTable().rows.length > 0 && this.renderTable().columns.length > 0) {
      const address: Address = {column: column, row: row};
      this._currentCell = this.renderTable().get(address)
      if (this.currentCell === undefined) {
        const index = this.renderTable().getIndexByAddress(address);
        if (index === undefined) {
          console.warn(`Cant select cell ${column}|${row}`);
          return;
        }
        this._currentCell = {address: address, columnIndex: index[0], rowIndex: index[1], input: '', content: ''};
      }
      this.input = this._currentCell?.input || '';
      const input = document.getElementsByName(this.tag)[0] as any;
      input?.setFocus();
    }
  }

  get currentCell(): OutputCell | undefined {
    return this._currentCell;
  }


  protected performAction(action: () => T | undefined) {
    if (this.communication.isConnected) {
      this.startStopwatch();
      this.modifiedState = false;
    } else {
      this.modifiedState = true;
    }
    const update = action();
    this.consistencyChecker.update(this.renderTable());
    if (update === undefined) {
      console.warn('Update is undefined');
      return;
    }
    this.communication.send(update);
    if (this.renderTable().rows.length === 1 && this.renderTable().columns.length === 1) {
      this.selectCell(this.renderTable().columns[0], this.renderTable().rows[0])
    } else if (this.renderTable().rows.length === 0 || this.renderTable().columns.length === 0) {
      this._currentCell = undefined;
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
    this.startStopwatch();
    this.handleMessage(message);
    this.consistencyChecker.update(this.renderTable());
    if (this.renderTable().rows.length === 0 || this.renderTable().columns.length === 0) {
      this._currentCell = undefined;
    }
  }


  public onNode(nodeId: string): void {
    this.consistencyChecker.addNodes(nodeId);
  }

  public changeConnectionState(enabled: boolean) {
    if (enabled && this.modifiedState) {
      this.startStopwatch();
      this.modifiedState = false;
    }
    this.communication.isConnected = enabled;
  }

  public get totalBytes(): number {
    return this.communication.countedBytes;
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


  get countedBytes(): number {
    return this._countedBytes;
  }

  get countedMessages(): number {
    return this._countedMessages;
  }

  get input(): string {
    return this._input;
  }

  set input(value: string) {
    this._input = value;
  }
}
