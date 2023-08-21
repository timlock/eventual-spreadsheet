import {AfterViewInit, Component, NgZone, OnInit} from '@angular/core';
import {SpreadsheetService} from "../../spreadsheet/controller/spreadsheet.service";
import {CellDto} from "../../spreadsheet/controller/CellDto";
import {RaftService} from "../../raft/controller/raft.service";
import {ActionType} from "../../spreadsheet/domain/ActionType";
import {Identifier} from "../../identifier/Identifier";
import {isPayload, Action} from "../../spreadsheet/util/Action";
import {RaftServiceObserver} from "../../raft/util/RaftServiceObserver";
import {Cell} from "../../spreadsheet/domain/Cell";
import {Address} from "../../spreadsheet/domain/Address";
import {PayloadFactory} from "../../spreadsheet/util/PayloadFactory";
import {Table} from "../../spreadsheet/domain/Table";
import {RaftMetaData} from "../../raft/util/RaftMetaData";
import {ConsistencyCheckerService} from "../../consistency-checker/consistency-checker.service";

@Component({
  selector: 'app-consistent-spreadsheet',
  templateUrl: './consistent-spreadsheet.page.html',
  styleUrls: ['./consistent-spreadsheet.page.scss'],
})
export class ConsistentSpreadsheetPage implements OnInit, AfterViewInit, RaftServiceObserver<Action> {
  private _table: Table<Cell>;
  private _currentCell: CellDto;
  private _nodes: Set<string> = new Set<string>();
  private channelName: string = 'consistent';
  private _raftMetaData: RaftMetaData = {term: 0, role: '', lastLogIndex: 0};
  private ionInput: any | undefined;
  private _trackedTime: number | undefined;
  private _receivedMessageCounter = 0;
  private _sentMessageCounter = 0;


  constructor(
    private raftService: RaftService,
    private spreadsheetService: SpreadsheetService,
    private ngZone: NgZone,
    private consistencyChecker: ConsistencyCheckerService
  ) {
    this._table = this.spreadsheetService.getTable();
    this._currentCell = this.spreadsheetService.getCellByIndex(1, 1);
  }


  public ngOnInit() {
    this.consistencyChecker.subscribe(this.raftService.identifier.uuid, this.table, (time: number) => {
      console.log('All updates applied ', time);
      this.ngZone.run(() => this._trackedTime = time);
    });
  }

  public ngAfterViewInit() {
    this.ionInput = document.getElementsByName('consistent-input')[0];
  }


  public ionViewDidEnter() {
    this.raftService.openChannel(this.channelName, this);
  }

  public start() {
    this.raftService.start();
  }


  public selectCell(colId: string, rowId: string) {
    this._currentCell = this.spreadsheetService.getCellById({column: colId, row: rowId});
    if (this.table.rows.length > 0 && this.table.columns.length > 0) {
      this.ionInput?.setFocus();
    }
  }

  public addRow() {
    let id = this.identifier.next();
    let message = PayloadFactory.addRow(id);
    this.performAction(message);
  }

  public insertRow(row: string) {
    let id = this.identifier.next();
    let message = PayloadFactory.insertRow(id, row);
    this.performAction(message);
  }

  public deleteRow(row: string) {
    let message = PayloadFactory.deleteRow(row);
    this.performAction(message);
  }

  public addColumn() {
    let id = this.identifier.next();
    let message = PayloadFactory.addColumn(id);
    this.performAction(message);
  }

  public insertColumn(column: string) {
    let id = this.identifier.next();
    let message = PayloadFactory.insertColumn(id, column);
    this.performAction(message);
  }

  public deleteColumn(column: string) {
    let message = PayloadFactory.deleteColumn(column);
    this.performAction(message);
  }

  public insertCell(cell: CellDto) {
    let message = PayloadFactory.insertCell(cell.address, cell.input);
    this.performAction(message)
  }

  private performAction(action: Action) {
    this.consistencyChecker.submittedState();
    this.ngZone.run(() => this._trackedTime = undefined);
    this.raftService.performAction(action);
  }

  public deleteCell(cell: CellDto) {
    cell.input = '';
    this.insertCell(cell);
  }

  public getCell(column: string, row: string): Cell | undefined {
    return this.spreadsheetService.getTable().get({column: column, row: row});
  }

  get currentCell(): CellDto {
    if (this._table.rows.indexOf(this._currentCell.row) === -1 || this._table.columns.indexOf(this._currentCell.column) === -1) {
      this.selectCell(this._table.columns[0], this._table.rows[0]);
    }
    return this._currentCell;
  }

  public onMessage(message: Action) {
    if (!isPayload(message)) {
      console.warn('Invalid message', message);
      return;
    }
    this.handleAction(message);
    this.ngZone.run(() => this._table = this.spreadsheetService.getTable());
    this.consistencyChecker.updateApplied(this.table);
  }

  public onNode(nodeId: string) {
    this._nodes.add(nodeId);
    this.ngZone.run(() => this._nodes = this.raftService.nodes);
    this.consistencyChecker.addNodes(nodeId);
  }

  public onStateChange(state: RaftMetaData) {
    this.ngZone.run(() => this._raftMetaData = state);
  }

  private handleAction(message: Action) {
    switch (message.action) {
      case ActionType.INSERT_CELL:
        let address: Address = {column: message.column!, row: message.row!};
        this.spreadsheetService.insertCellById(address, message.input!);
        break;
      case ActionType.ADD_ROW:
        this.spreadsheetService.addRow(message.input!);
        break;
      case ActionType.INSERT_ROW:
        this.spreadsheetService.insertRow(message.input!, message.row!)
        break;
      case ActionType.ADD_COLUMN:
        this.spreadsheetService.addColumn(message.input!);
        break;
      case ActionType.INSERT_COLUMN:
        this.spreadsheetService.insertColumn(message.input!, message.column!);
        break;
      case ActionType.DELETE_COLUMN:
        this.spreadsheetService.deleteColumn(message.column!);
        break;
      case ActionType.DELETE_ROW:
        this.spreadsheetService.deleteRow(message.row!)
        break;
      default:
        console.warn('Cant perform action for message: ', message);
        break;
    }
  }


  get table(): Table<Cell> {
    this._table = this.spreadsheetService.getTable();
    return this._table;
  }

  set table(value: Table<Cell>) {
    this._table = value;
  }

  get nodes(): Set<string> {
    this._nodes = this.raftService.nodes;
    return this._nodes;
  }

  get identifier(): Identifier {
    return this.raftService.identifier;
  }

  get isConnected(): boolean {
    return this.raftService.isConnected;
  }

  set isConnected(enabled: boolean) {
    this.raftService.isConnected = enabled;
  }

  get raftMetaData(): RaftMetaData {
    this._raftMetaData = this.raftService.getMetaData();
    return this._raftMetaData;
  }

  get trackedTime(): number | undefined {
    return this._trackedTime;
  }


  get isActive(): boolean {
    return this.raftService.isActive();
  }

  get receivedMessageCounter(): number {
    this._receivedMessageCounter = this.raftService.receivedMessageCounter;
    return this._receivedMessageCounter;
  }

  get sentMessageCounter(): number {
    this._sentMessageCounter = this.raftService.sentMessageCounter;
    return this._sentMessageCounter;
  }

  public onMessageCounterUpdate(received: number, total: number) {
    this.ngZone.run(() => {
      this._receivedMessageCounter = received;
      this._sentMessageCounter = total;
    });
  }
}


