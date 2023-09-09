import {OutputCell} from "../spreadsheet/domain/OutputCell";
import {Address} from "../spreadsheet/domain/Address";
import {CommunicationObserver} from "../communication/controller/CommunicationObserver";
import {ConsistencyCheckerService} from "../consistency-checker/consistency-checker.service";
import {Communication} from "./Communication";
import {TestResult, TestType} from "./TestResult";
import {Spreadsheet} from "./Spreadsheet";

export abstract class TestEnvironment<T> implements CommunicationObserver<T> {
  private _currentCell: OutputCell | undefined;
  private _input = '';
  private startTime: number | undefined;
  private byteCounterStart = 0;
  private messageCounterStart = 0;
  private _growQuantity = 0;
  private modifiedState = false;
  private currentTestRun: number | undefined;
  private clearResults: TestResult[] = [];
  private growResults: TestResult[] = [];
  private _testSize = 3;
  private _testRuns = 10;
  private currentResult: TestResult = TestResult.empty();
  private _measureTime = true;

  protected constructor(
    private consistencyChecker: ConsistencyCheckerService<OutputCell>,
    private _communication: Communication<T>,
    private _spreadsheet: Spreadsheet<T>,
    private readonly tag: string
  ) {
    const address = this._spreadsheet.renderTable().getAddressByIndex(0, 0);
    if (address !== undefined) {
      this.selectCell(address.column, address.row);
    }
  }

  public ionViewDidEnter() {
    this._communication.openChannel(this.tag, this);
    this.startTimeMeasuring();
  }

  public addRow() {
    const id = this._communication.identifier.next();
    this.performAction(() => this._spreadsheet.addRow(id));
  }

  public insertRow(row: string) {
    const id = this._communication.identifier.next();
    this.performAction(() => this._spreadsheet.insertRow(id, row));
  }

  public deleteRow(row: string) {
    this.performAction(() => this._spreadsheet.deleteRow(row));
  }

  public addColumn() {
    const id = this._communication.identifier.next();
    this.performAction(() => this._spreadsheet.addColumn(id));
  }

  public insertColumn(column: string) {
    const id = this._communication.identifier.next();
    this.performAction(() => this._spreadsheet.insertColumn(id, column));
  }

  public deleteColumn(column: string) {
    this.performAction(() => this._spreadsheet.deleteColumn(column));
  }

  public insertCell(address: Address, input: string) {
    this.performAction(() => this._spreadsheet.insertCellById(address, input));
  }

  public deleteCell(address: Address) {
    this.insertCell(address, '');
  }


  private startStopwatch() {
    if (this.startTime === undefined) {
      this.startTime = Date.now();
      this.byteCounterStart = this._communication.totalBytes;
      this.messageCounterStart = this._communication.countedMessages;
    }
  }


  public startTests() {
    this.clear();
    this.currentTestRun = -1;
    this.clearResults = [];
    this.growResults = [];
    this.grow(this._testSize);
    // this.fillTable();
  }


  public startTimeMeasuring() {
    this.consistencyChecker.subscribe(this._communication.identifier.uuid, this._spreadsheet.renderTable(), () => {
      // console.log('Consistent', this._communication.countedMessages - this.messageCounterStart)
      if (this.startTime !== undefined) {
        this.updateCurrentResult();
        if (this.currentTestRun === undefined) {
          console.info(this.currentResult.toCSVBody());
        }
        if (this.currentTestRun !== undefined
          && this.currentResult.type !== undefined
          && this.currentTestRun < this.testRuns
        ) {
          switch (this.currentResult.type) {
            case TestType.CLEAR: {
              if (this.currentTestRun > -1) {
                this.clearResults.push(this.currentResult);
              }
              this.currentTestRun++;
              if (this.currentTestRun < this.testRuns) {
                this.grow(this._testSize);
                // this.fillTable();
              }
            }
              break;
            case TestType.GROW:
              if (this.currentTestRun > -1) {
                this.growResults.push(this.currentResult);
              }
              this.clear();
              break;
          }
        }
        if (this.currentTestRun === this._testRuns) {
          this.evaluateTest();
          if (this._measureTime && this.countBytes) {
            this._measureTime = false;
            this.startTests();
          } else if (this._measureTime && !this.countBytes) {
            this._measureTime = false;
            this.countBytes = true;
            this.startTests();
          }
        }
      }
    });
  }

  private evaluateTest() {
    this.currentTestRun = undefined;
    console.info(this.createFile(TestType.GROW, this.growResults));
    console.info(this.createFile(TestType.CLEAR, this.clearResults));
  }

  private createFile(type: TestType, results: TestResult[]): string {
    let file = `${this.tag}_${type}_${this._communication.nodes.size + 1}nodes_${this._testSize}testSize`;
    if (this.measureTime) {
      file += '_measuredTime';
    }
    if (this.countBytes) {
      file += '_countedBytes';
    }
    file += '_';
    file += this.communication.delay;
    file += 'delay.csv\n';
    file += 'time,bytes,messages,nodes,testSize,delay\n';
    results.sort((a, b) => a.time === 0 ? a.bytes - b.bytes : a.time - b.time);
    for (const result of results) {
      file += result.toCSVBody();
      file += `,${this._communication.nodes.size + 1},${this._testSize},${this._communication.delay}\n`;
    }
    return file;
  }

  private updateCurrentResult() {
    if (this.startTime !== undefined) {
      const time = this.measureTime ? Date.now() - this.startTime : 0;
      this.startTime = undefined;
      const bytes = this._communication.totalBytes - this.byteCounterStart
      const messages = this._communication.countedMessages - this.messageCounterStart;
      let type: TestType | undefined;
      if (this.currentTestRun !== undefined) {
        if (this._spreadsheet.renderTable().rows.length === 0 && this._spreadsheet.renderTable().columns.length === 0 && this.currentResult.type !== TestType.CLEAR) {
          type = TestType.CLEAR;
        } else if (this._spreadsheet.renderTable().rows.length === this.testSize && this._spreadsheet.renderTable().columns.length === this.testSize && this.currentResult.type !== TestType.GROW) {
          type = TestType.GROW;
        }
      }
      this.currentResult = new TestResult(bytes, messages, time, type);
    }
  }

  public selectCell(column: string, row: string) {
    if (this._spreadsheet.renderTable().rows.length > 0 && this._spreadsheet.renderTable().columns.length > 0) {
      const address: Address = {column: column, row: row};
      this._currentCell = this._spreadsheet.renderTable().get(address)
      if (this.currentCell === undefined) {
        const index = this._spreadsheet.renderTable().getIndexByAddress(address);
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


  protected performAction(action: () => T | undefined) {
    const startedStopWatch = this.startTime === undefined;
    if (this._communication.isConnected) {
      this.startStopwatch();
      this.modifiedState = false;
    } else {
      this.modifiedState = true;
    }
    const update = action();
    if (update === undefined) {
      console.warn('Update is undefined');
      if (startedStopWatch) {
        this.startTime = undefined;
      }
      return;
    }
    this.consistencyChecker.update(this._spreadsheet.renderTable());
    this._communication.send(update);
    if (this._spreadsheet.renderTable().rows.length === 1 && this._spreadsheet.renderTable().columns.length === 1) {
      this.selectCell(this._spreadsheet.renderTable().columns[0], this._spreadsheet.renderTable().rows[0])
    } else if (this._spreadsheet.renderTable().rows.length === 0 || this._spreadsheet.renderTable().columns.length === 0) {
      this._currentCell = undefined;
    }
  }

  public clear() {
    for (let column of this._spreadsheet.renderTable().columns) {
      for (let row of this._spreadsheet.renderTable().rows) {
        this.deleteCell({column: column, row: row});
      }
    }
    const rows = Array.from(this._spreadsheet.renderTable().rows);
    for (let row of rows) {
      this.deleteRow(row);
    }
    const columns = Array.from(this._spreadsheet.renderTable().columns);
    for (let column of columns) {
      this.deleteColumn(column);
    }
  }

  public grow(quantity: number) {
    let columns = [];
    let rows = [];
    for (let i = 0; i < quantity; i++) {
      this.addColumn();
      columns.push(this._communication.identifier.getLastId());
      this.addRow();
      rows.push(this._communication.identifier.getLastId());
    }
    let counter = 0;
    for (let column of columns) {
      for (let row of rows) {
        counter++;
        this.insertCell({column: column, row: row}, counter + '');
      }
    }
  }

  public fillTable() {
    let counter = 0;
    for (let column of this._spreadsheet.renderTable().columns) {
      for (let row of this._spreadsheet.renderTable().rows) {
        counter++;
        this.insertCell({column: column, row: row}, counter + '');
      }
    }
  }

  public onMessage(message: T): void {
    this._spreadsheet.applyUpdate(message);
    this.consistencyChecker.update(this._spreadsheet.renderTable());
    if (this._spreadsheet.renderTable().rows.length === 0 || this._spreadsheet.renderTable().columns.length === 0) {
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
    this._communication.isConnected = enabled;
  }


  get currentCell(): OutputCell | undefined {
    return this._currentCell;
  }

  public get totalBytes(): number {
    return this._communication.totalBytes;
  }

  public get isConnected(): boolean {
    return this._communication.isConnected;
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


  get testRuns(): number {
    return this._testRuns;
  }

  set testRuns(value: number) {
    this._testRuns = value;
  }


  get communication(): Communication<T> {
    return this._communication;
  }

  get spreadsheet(): Spreadsheet<T> {
    return this._spreadsheet;
  }

  get growQuantity(): number {
    return this._growQuantity;
  }

  set growQuantity(value: number) {
    this._growQuantity = value;
  }

  get countBytes(): boolean {
    return this._communication.countBytes;
  }

  set countBytes(value: boolean) {
    this._communication.countBytes = value;
  }


  get measureTime(): boolean {
    return this._measureTime;
  }

  set measureTime(value: boolean) {
    this._measureTime = value;
  }

  get delay(): number {
    return this._communication.delay;
  }

  set delay(value: number) {
    this._communication.delay = value;
  }
}
