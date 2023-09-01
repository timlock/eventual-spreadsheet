import {Table} from "../spreadsheet/domain/Table";
import {OutputCell} from "../spreadsheet/domain/OutputCell";
import {Address} from "../spreadsheet/domain/Address";
import {CommunicationServiceObserver} from "../communication/controller/CommunicationServiceObserver";
import {ConsistencyCheckerService} from "../consistency-checker/consistency-checker.service";
import {Communication} from "./Communication";
import {TestResult, TestType} from "./TestResult";

export abstract class SpreadsheetPage<T> implements CommunicationServiceObserver<T> {
  private _currentCell: OutputCell | undefined;
  private _input = '';
  private startTime: number | undefined;
  private byteCounterStart = 0;
  private messageCounterStart = 0;
  protected growQuantity = 0;
  protected modifiedState = false;
  private textExecution: number | undefined;
  private testResults: TestResult[] = [];
  private _testSize = 10;
  private currentResult: TestResult = TestResult.empty();

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
    if (this.startTime === undefined) {
      this.startTime = Date.now();
      this.byteCounterStart = this.communication.totalBytes;
      this.messageCounterStart = this.communication.countedMessages;
    }
  }

  public startTests() {
    this.clear();
    this.textExecution = 0;
    this.testResults = [];
    console.info(`${this.tag},${this.communication.nodes.size + 1},${this.testSize}`);
    this.grow(this._testSize);
    this.fillTable();
  }


  public startTimeMeasuring() {
    this.consistencyChecker.subscribe(this.communication.identifier.uuid, this.renderTable(), () => {
      if (this.startTime !== undefined) {
        this.updateCurrentResult();
        if (this.textExecution !== undefined && this.currentResult.type !== undefined) {
          console.log(`${this.textExecution}. test round`);
          this.testResults.push(this.currentResult);
          this.textExecution++;
          if (this.textExecution <= 10) {
            switch (this.currentResult.type) {
              case TestType.CLEAR:
                this.grow(this._testSize);
                this.fillTable();
                break;
              case TestType.GROW:
                this.clear();
                break;
            }
          } else {
            this.textExecution = undefined;
            this.logResults();
          }
        }
      }
    });
  }

  private updateCurrentResult() {
    if (this.startTime !== undefined) {
      const time = Date.now() - this.startTime;
      this.startTime = undefined;
      const bytes = this.communication.totalBytes - this.byteCounterStart
      const messages = this.communication.countedMessages - this.messageCounterStart;
      let type: TestType | undefined;
      if (this.renderTable().rows.length === 0 && this.renderTable().columns.length === 0 && this.currentResult.type !== TestType.CLEAR) {
        type = TestType.CLEAR;
      }
      if (this.renderTable().rows.length === this.testSize && this.renderTable().columns.length === this.testSize && this.currentResult.type !== TestType.GROW) {
        type = TestType.GROW;
      }
      this.currentResult = new TestResult(bytes, messages, time, type);
    }
  }

  private logResults() {
    console.info('type, time, bytes, messages')
    this.testResults
      .sort((a, b) => a.compareType(b))
      .map((result) => result.toCSVBody())
      .forEach((csv) => console.info(csv));
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
    return this.communication.totalBytes;
  }

  public get isConnected(): boolean {
    return this.communication.isConnected;
  }

  public set isConnected(enabled: boolean) {
    this.changeConnectionState(enabled);
  }


  get trackedTime(): number {
    return this.currentResult.time;
  }


  get countedBytes(): number {
    return this.currentResult.bytes;
  }

  get countedMessages(): number {
    return this.currentResult.messages;
  }

  get input(): string {
    return this._input;
  }

  set input(value: string) {
    this._input = value;
  }


  get testSize(): number {
    return this._testSize;
  }

  set testSize(value: number) {
    this._testSize = value;
  }
}
