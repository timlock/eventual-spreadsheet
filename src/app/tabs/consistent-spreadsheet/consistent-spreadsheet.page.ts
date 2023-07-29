import {AfterViewInit, Component, NgZone, OnInit} from '@angular/core';
import {SpreadsheetService} from "../../spreadsheet/controller/spreadsheet.service";
import {CellDto} from "../../spreadsheet/controller/CellDto";
import {RaftService} from "../../raft/raft.service";
import {Action} from "../../spreadsheet/util/Action";
import {Identifier} from "../../Identifier";
import {isPayload, Payload} from "../../spreadsheet/util/Payload";
import {RaftServiceObserver} from "../../raft/RaftServiceObserver";
import {Cell} from "../../spreadsheet/domain/Cell";
import {Address} from "../../spreadsheet/domain/Address";
import {PayloadFactory} from "../../spreadsheet/util/PayloadFactory";
import {Table} from "../../spreadsheet/domain/Table";
import {RaftMetaData} from "../../raft/RaftMetaData";

@Component({
  selector: 'app-consistent-spreadsheet',
  templateUrl: './consistent-spreadsheet.page.html',
  styleUrls: ['./consistent-spreadsheet.page.scss'],
})
export class ConsistentSpreadsheetPage implements OnInit,AfterViewInit, RaftServiceObserver<Payload> {
  private raftService: RaftService;
  private spreadsheetService: SpreadsheetService;
  private ngZone: NgZone;
  private _table: Table<Cell>;
  private _currentCell: CellDto;
  private _nodes: Set<string> = new Set<string>();
  private channelName: string = 'consistent';
  private _raftMetaData: RaftMetaData = {term: 0, role: '', lastLogIndex: 0};
  private ionInput: any | undefined;

  constructor(
    raftService: RaftService,
    spreadsheetService: SpreadsheetService,
    ngZone: NgZone
  ) {
    this.raftService = raftService;
    this.spreadsheetService = spreadsheetService;
    this.ngZone = ngZone;
    this._table = this.spreadsheetService.getTable();
    this._currentCell = this.spreadsheetService.getCellByIndex(1, 1);
  }


  public ngOnInit() {
    this.raftService.openChannel(this.channelName, this);
  }

  public ngAfterViewInit() {
    this.ionInput = document.getElementsByName('input')[0];
  }

  public selectCell(colId: string, rowId: string) {
    this._currentCell = this.spreadsheetService.getCellById({column: colId, row: rowId});
    if(this.table.rows.length > 0 && this.table.columns.length > 0){
      this.ionInput?.setFocus();
    }  }

  public addRow() {
    let id = this.identifier.next();
    let message = PayloadFactory.addRow(id);
    this.raftService.performAction(message);
  }

  public insertRow(row: string) {
    let id = this.identifier.next();
    let message = PayloadFactory.insertRow(id, row);
    this.raftService.performAction(message);
  }

  public deleteRow(row: string) {
    let message = PayloadFactory.deleteRow(row);
    this.raftService.performAction(message);
  }

  public addColumn() {
    let id = this.identifier.next();
    let message = PayloadFactory.addColumn(id);
    this.raftService.performAction(message);
  }

  public insertColumn(column: string) {
    let id = this.identifier.next();
    let message = PayloadFactory.insertColumn(id, column);
    this.raftService.performAction(message);
  }

  public deleteColumn(column: string) {
    let message = PayloadFactory.deleteColumn(column);
    this.raftService.performAction(message);
  }

  public insertCell(cell: CellDto) {
    let message = PayloadFactory.insertCell(cell.address, cell.input);
    this.raftService.performAction(message);
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

  public onMessage(message: Payload) {
    if (!isPayload(message)) {
      console.warn('Invalid message', message);
      return;
    }
    this.performAction(message);
    this.ngZone.run(() => this._table = this.spreadsheetService.getTable());
  }

  public onNode(nodeId: string) {
    this._nodes.add(nodeId);
    this.ngZone.run(() => this._nodes = this.raftService.nodes);
  }

  public onStateChange(state: RaftMetaData) {
    this.ngZone.run(() => this._raftMetaData = state);
  }

  private performAction(message: Payload) {
    switch (message.action) {
      case Action.INSERT_CELL:
        let address: Address = {column: message.column!, row: message.row!};
        this.spreadsheetService.insertCellById(address, message.input!);
        break;
      case Action.ADD_ROW:
        this.spreadsheetService.addRow(message.input!);
        break;
      case Action.INSERT_ROW:
        this.spreadsheetService.insertRow(message.input!, message.row!)
        break;
      case Action.ADD_COLUMN:
        this.spreadsheetService.addColumn(message.input!);
        break;
      case Action.INSERT_COLUMN:
        this.spreadsheetService.insertColumn(message.input!, message.column!);
        break;
      case Action.DELETE_COLUMN:
        this.spreadsheetService.deleteColumn(message.column!);
        break;
      case Action.DELETE_ROW:
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

  get clusterSize(): number {
    return this.nodes.size;
  }

  get identifier(): Identifier {
    return this.raftService.identifier;
  }

  get connectionEnabled(): boolean {
    return this.raftService.isConnected;
  }

  set connectionEnabled(enabled: boolean) {
    this.raftService.isConnected = enabled;
  }

  get raftMetaData(): RaftMetaData {
    this._raftMetaData = this.raftService.getMetaData();
    return this._raftMetaData;
  }
}


