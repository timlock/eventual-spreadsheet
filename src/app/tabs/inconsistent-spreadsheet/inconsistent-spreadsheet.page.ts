import {AfterViewInit, ApplicationRef, Component, OnInit} from '@angular/core';
import {CommunicationServiceObserver} from "../../communication/controller/CommunicationServiceObserver";
import {SpreadsheetService} from "../../spreadsheet/controller/spreadsheet.service";
import {CellDto} from "../../spreadsheet/controller/CellDto";
import {CommunicationService} from "../../communication/controller/communication.service";
import {RaftService} from "../../communication/controller/raft.service";
import {Action} from "../../spreadsheet/util/Action";
import {Identifier} from "../../Identifier";
import {isPayload, Payload} from "../../spreadsheet/util/Payload";
import {Cell} from "../../spreadsheet/domain/Cell";
import {Address} from "../../spreadsheet/domain/Address";
import {PayloadFactory} from "../../spreadsheet/util/PayloadFactory";

@Component({
  selector: 'app-inconsistent-spreadsheet',
  templateUrl: './inconsistent-spreadsheet.page.html',
  styleUrls: ['./inconsistent-spreadsheet.page.scss'],
})
export class InconsistentSpreadsheetPage implements OnInit, AfterViewInit, CommunicationServiceObserver<Payload> {
  private spreadsheetService: SpreadsheetService;
  private _currentCell: CellDto;
  private channelName: string = 'spreadsheet';
  private communicationService: CommunicationService<Payload>;
  private applicationRef: ApplicationRef;
  public isEditingColumn = false;
  private currentColumn = '';
  public isEditingRow = false;
  private currentRow = '';

  // private ionInput: HTMLIonInputElement | undefined;

  constructor(communicationService: CommunicationService<Payload>, raftService: RaftService, applicationRef: ApplicationRef, spreadsheetService: SpreadsheetService) {
    this.spreadsheetService = spreadsheetService;
    this._currentCell = this.spreadsheetService.getCellByIndex(1, 1);
    this.applicationRef = applicationRef;
    this.communicationService = communicationService;
  }

  public handleOperation(ev: any, id: string){
    console.log(ev.detail, id);
  }

  public editColumn(column: string){
    if(this.isEditingColumn){
      this.isEditingColumn = false;
      return;
    }
    this.isEditingColumn = true;
    this.currentColumn = column;
  }

  public submitColumnEdit(action?: Action){
    this.isEditingColumn = false;
    switch (action){
      case Action.ADD_COLUMN: this.insertColumn(this.currentColumn);
      break;
      case Action.DELETE_COLUMN: this.deleteColumn(this.currentColumn);
      break;
    }
  }
  public editRow(row: string){
    if(this.isEditingRow){
      this.isEditingRow = false;
      return;
    }
    this.isEditingRow = true;
    this.currentRow = row;
  }

  public submitRowEdit(action?: Action){
    console.log(this.currentRow);
    console.log(action)
    this.isEditingRow = false;
    switch (action){
      case Action.ADD_ROW: this.insertRow(this.currentRow);
      break;
      case Action.DELETE_COLUMN: this.deleteRow(this.currentRow);
      break;
    }
  }

  public ngOnInit() {
    this.communicationService.openChannel(this.channelName, this);
  }

  public ngAfterViewInit() {
    // this.ionInput = document.getElementsByName('input')[0] as HTMLIonInputElement;
  }


  public selectCell(colId: string, rowId: string) {
    this._currentCell = this.spreadsheetService.getCellById({column: colId, row: rowId});
    // this.ionInput?.setFocus();
  }

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


  get rows(): string[] {
    return this.spreadsheetService.rows;
  }

  get columns(): string[] {
    return this.spreadsheetService.columns;
  }

  get currentCell(): CellDto {
    if (this.rows.indexOf(this._currentCell.row) === -1 || this.columns.indexOf(this._currentCell.column) === -1) {
      this.selectCell(this.columns[0], this.rows[0]);
    }
    return this._currentCell;
  }

  public onMessage(message: Payload, source: string) {
    if (!isPayload(message)) {
      console.warn('Invalid message', message);
      return;
    }
    this.performAction(message);
    this.applicationRef.tick();
  }

  public onNode(nodeId: string) {
    this.applicationRef.tick();
  }

  private performAction(payload: Payload) {
    switch (payload.action) {
      case Action.INSERT_CELL:
        let address: Address = {column: payload.column!, row: payload.row!};
        this.spreadsheetService.insertCellById(address, payload.input!);
        break;
      case Action.ADD_ROW:
        this.spreadsheetService.addRow(payload.input!);
        break;
      case Action.INSERT_ROW:
        this.spreadsheetService.insertRow(payload.input!, payload.row!)
        break;
      case Action.ADD_COLUMN:
        this.spreadsheetService.addColumn(payload.input!);
        break;
      case Action.INSERT_COLUMN:
        this.spreadsheetService.insertColumn(payload.input!, payload.column!);
        break;
      case Action.DELETE_COLUMN:
        this.spreadsheetService.deleteColumn(payload.column!);
        break;
      case Action.DELETE_ROW:
        this.spreadsheetService.deleteRow(payload.row!)
        break;
      default:
        console.warn('Cant perform action for payload: ', payload);
        break;
    }
  }


  get nodes(): Set<string> {
    return this.communicationService.nodes;
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

  protected readonly Action = Action;
}

