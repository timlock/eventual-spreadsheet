import {ApplicationRef, Component, OnInit} from '@angular/core';
import {SpreadsheetService} from "../../spreadsheet/controller/spreadsheet.service";
import {CellDto} from "../../spreadsheet/controller/CellDto";
import {RaftService} from "../../communication/controller/raft.service";
import {CommunicationService} from "../../communication/controller/communication.service";
import {PayloadBuilder} from "../../spreadsheet/util/PayloadBuilder";
import {Action} from "../../communication/Action";
import {Identifier} from "../../Identifier";
import {isPayload, Payload} from "../../spreadsheet/util/Payload";
import {RaftServiceObserver} from "../../communication/controller/RaftServiceObserver";
import {Cell} from "../../spreadsheet/domain/Cell";
import {Address} from "../../spreadsheet/domain/Address";

@Component({
  selector: 'app-consistent-spreadsheet',
  templateUrl: './consistent-spreadsheet.page.html',
  styleUrls: ['./consistent-spreadsheet.page.scss'],
})
export class ConsistentSpreadsheetPage implements OnInit, RaftServiceObserver<Payload> {
  private spreadsheetService: SpreadsheetService;
  private _currentCell: CellDto;
  private channelName: string = 'spreadsheet';
  private raftService: RaftService;
  private applicationRef: ApplicationRef;
  private _messageList: Payload[] = [];
  private _role: string = '';

  constructor(communicationService: CommunicationService<Payload>, raftService: RaftService, applicationRef: ApplicationRef, spreadsheetService: SpreadsheetService) {
    this.spreadsheetService = spreadsheetService;
    this._currentCell = this.spreadsheetService.getCellByIndex(0, 0);
    this.applicationRef = applicationRef;
    this.raftService = raftService;
  }


  ngOnInit() {
    this.raftService.openChannel(this.channelName, this);
  }


  public selectCell(colId: string, rowId: string) {
    this._currentCell = this.spreadsheetService.getCellById({column: colId, row: rowId});
  }

  public addRow() {
    let id = this.identifier.next();
    let message = new PayloadBuilder()
      .action(Action.ADD_ROW)
      .input(id)
      .build();
    if (message === undefined) {
      console.warn('addRow cant build message')
      return
    }
    this.raftService.postMessage(message);
    return;
  }

  public insertRow(row: string) {
    let id = this.identifier.next();
    let message = new PayloadBuilder()
      .action(Action.INSERT_ROW)
      .address({column: '', row: row})
      .input(id)
      .build();
    if (message === undefined) {
      console.warn('insertRow cant build message')
      return
    }
    this.raftService.postMessage(message);
    return;
  }

  public deleteRow(row: string) {
    let message = new PayloadBuilder()
      .action(Action.DELETE_ROW)
      .address({column: '', row: row})
      .build();
    if (message === undefined) {
      console.warn('deleteRow cant build message')
      return
    }
    this.raftService.postMessage(message);
    return;
  }

  public addColumn() {
    let id = this.identifier.next();
    let message = new PayloadBuilder()
      .action(Action.ADD_COLUMN)
      .input(id)
      .build();
    if (message === undefined) {
      console.warn('addColumn cant build message')
      return
    }
    this.raftService.postMessage(message);
    return;
  }

  public insertColumn(column: string) {
    let id = this.identifier.next();
    let message = new PayloadBuilder()
      .action(Action.INSERT_COLUMN)
      .address({column: column, row: ''})
      .input(id)
      .build();
    if (message === undefined) {
      console.warn('insertColumn cant build message')
      return
    }
    this.raftService.postMessage(message);
    return;
  }

  public deleteColumn(column: string) {
    let message = new PayloadBuilder()
      .action(Action.DELETE_COLUMN)
      .address({column: column, row: ''})
      .build();
    if (message === undefined) {
      console.warn('deleteColumn cant build message')
      return
    }
    this.raftService.postMessage(message);
    return;
  }

  public insertCell(cell: CellDto) {
    let message = new PayloadBuilder()
      .action(Action.INSERT_CELL)
      .address(cell.address)
      .input(cell.input)
      .build();
    if (message === undefined) {
      console.warn('insertCell cant build message')
      return
    }
    this.raftService.postMessage(message);
    return;
  }

  public deleteCell(cell: CellDto) {
    cell.input = '';
    this.insertCell(cell);
  }

  public getCell(column: string, row: string): Cell | undefined {
    return this.spreadsheetService.renderTable().get({column: column, row: row});
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

  public onMessage(message: Payload) {
    if (!isPayload(message)) {
      console.warn('Invalid message', message);
      return;
    }
    this._messageList.push(message);
    this.performAction(message);
    this.applicationRef.tick();
  }

  public onNode(nodeId: string) {
    this.applicationRef.tick();
  }

  public onRoleChange(newRole: string) {
    this._role = newRole;
    this.applicationRef.tick();
  }

  private performAction(message: Payload) {
    switch (message.action) {
      case Action.INSERT_CELL:
        let address: Address = {column: message.column!, row: message.row!};
        let cell = new CellDto(address, message.input!);
        this.spreadsheetService.insertCell(cell);
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


  get messageList(): Payload[] {
    return this._messageList;
  }

  get nodes(): Set<string> {
    return this.raftService.nodes;
  }

  get clusterSize(): number {
    return this.nodes.size;
  }

  get identifier(): Identifier {
    return this.raftService.identifier;
  }


  get role(): string {
    return this._role;
  }
}


