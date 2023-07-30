import {AfterViewInit, Component, NgZone, OnInit} from '@angular/core';
import {CommunicationServiceObserver} from "../../communication/controller/CommunicationServiceObserver";
import {SpreadsheetService} from "../../spreadsheet/controller/spreadsheet.service";
import {CellDto} from "../../spreadsheet/controller/CellDto";
import {CommunicationService} from "../../communication/controller/communication.service";
import {ActionType} from "../../spreadsheet/domain/ActionType";
import {Identifier} from "../../identifier/Identifier";
import {isPayload, Action} from "../../spreadsheet/util/Action";
import {Cell} from "../../spreadsheet/domain/Cell";
import {Address} from "../../spreadsheet/domain/Address";
import {PayloadFactory} from "../../spreadsheet/util/PayloadFactory";
import {Table} from "../../spreadsheet/domain/Table";

@Component({
  selector: 'app-inconsistent-spreadsheet',
  templateUrl: './inconsistent-spreadsheet.page.html',
  styleUrls: ['./inconsistent-spreadsheet.page.scss'],
})
export class InconsistentSpreadsheetPage implements OnInit, AfterViewInit, CommunicationServiceObserver<Action> {
  private communicationService: CommunicationService<Action>;
  private spreadsheetService: SpreadsheetService;
  private ngZone: NgZone;
  private _table: Table<Cell>;
  private _currentCell: CellDto;
  private _nodes: Set<string> = new Set<string>();
  private channelName: string = 'inconsistent';
  private ionInput: any | undefined;

  constructor(
    communicationService: CommunicationService<Action>,
    spreadsheetService: SpreadsheetService,
    ngZone: NgZone
  ) {
    this.communicationService = communicationService;
    this.spreadsheetService = spreadsheetService;
    this.ngZone = ngZone;
    this._table = this.spreadsheetService.getTable();
    this._currentCell = this.spreadsheetService.getCellByIndex(1, 1);
  }

  public ngOnInit() {
    this.communicationService.openChannel(this.channelName, this);
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
    this.spreadsheetService.addRow(id);
    this.communicationService.send(message!);
  }

  public insertRow(row: string) {
    let id = this.identifier.next();
    let message = PayloadFactory.insertRow(id, row);
    this.spreadsheetService.insertRow(id, row);
    this.communicationService.send(message!);
  }

  public deleteRow(row: string) {
    let message = PayloadFactory.deleteRow(row);
    this.spreadsheetService.deleteRow(row);
    this.communicationService.send(message!);
  }

  public addColumn() {
    let id = this.identifier.next();
    let message = PayloadFactory.addColumn(id);
    this.spreadsheetService.addColumn(id);
    this.communicationService.send(message!);
  }

  public insertColumn(column: string) {
    let id = this.identifier.next();
    let message = PayloadFactory.insertColumn(id, column);
    this.spreadsheetService.insertColumn(id, column);
    this.communicationService.send(message!);
  }

  public deleteColumn(column: string) {
    let message = PayloadFactory.deleteColumn(column);
    this.spreadsheetService.deleteColumn(column);
    this.communicationService.send(message!);
  }

  public insertCell(cell: CellDto) {
    let message = PayloadFactory.insertCell(cell.address, cell.input);
    this.spreadsheetService.insertCellById(cell.address, cell.input);
    this.communicationService.send(message!);
  }

  public deleteCell(cell: CellDto) {
    cell.input = '';
    this.insertCell(cell);
  }

  public getCell(column: string, row: string): Cell | undefined {
    return this.spreadsheetService.getTable().get({column: column, row: row});
  }


  get currentCell(): CellDto {
    if (this.table.rows.indexOf(this._currentCell.row) === -1 || this.table.columns.indexOf(this._currentCell.column) === -1) {
      this.selectCell(this.table.columns[0], this.table.rows[0]);
    }
    return this._currentCell;
  }

  public onMessage(message: Action, source: string) {
    if (!isPayload(message)) {
      console.warn('Invalid message', message);
      return;
    }
    this.handleAction(message);
    this.ngZone.run(() => this.table = this.spreadsheetService.getTable());
  }

  public onNode(nodeId: string) {
    this._nodes.add(nodeId);
    this.ngZone.run(() => this._nodes = this.communicationService.nodes);
  }

  private handleAction(payload: Action) {
    switch (payload.action) {
      case ActionType.INSERT_CELL:
        let address: Address = {column: payload.column!, row: payload.row!};
        this.spreadsheetService.insertCellById(address, payload.input!);
        break;
      case ActionType.ADD_ROW:
        this.spreadsheetService.addRow(payload.input!);
        break;
      case ActionType.INSERT_ROW:
        this.spreadsheetService.insertRow(payload.input!, payload.row!)
        break;
      case ActionType.ADD_COLUMN:
        this.spreadsheetService.addColumn(payload.input!);
        break;
      case ActionType.INSERT_COLUMN:
        this.spreadsheetService.insertColumn(payload.input!, payload.column!);
        break;
      case ActionType.DELETE_COLUMN:
        this.spreadsheetService.deleteColumn(payload.column!);
        break;
      case ActionType.DELETE_ROW:
        this.spreadsheetService.deleteRow(payload.row!)
        break;
      default:
        console.warn('Cant perform action for payload: ', payload);
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
    return this._nodes;
  }

  get clusterSize(): number {
    return this.nodes.size;
  }

  get identifier(): Identifier {
    return this.communicationService.identifier;
  }

  get connectionEnabled(): boolean {
    return this.communicationService.isConnected;
  }

  set connectionEnabled(enabled: boolean) {
    this.communicationService.isConnected = enabled;
  }

}

