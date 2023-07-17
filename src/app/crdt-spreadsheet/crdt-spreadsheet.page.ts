import {ApplicationRef, Component, OnDestroy, OnInit} from '@angular/core';
import {RemoteObserver} from "../communication/RemoteObserver";
import {Message} from "../communication/Message";
import {SpreadsheetService} from "../spreadsheet/controller/spreadsheet.service";
import {CellDto} from "../spreadsheet/controller/CellDto";
import {CommunicationService} from "../communication/communication.service";
import {RaftService} from "../communication/raft.service";
import {Address} from "../spreadsheet/domain/Address";
import {MessageBuilder} from "../spreadsheet/controller/MessageBuilder";
import {Action} from "../spreadsheet/domain/Action";
import {Cell} from "../spreadsheet/domain/Cell";
import {Identifier} from "../spreadsheet/util/Identifier";
import {isPayload, Payload} from "../spreadsheet/util/Payload";

@Component({
  selector: 'app-crdt-spreadsheet',
  templateUrl: './crdt-spreadsheet.page.html',
  styleUrls: ['./crdt-spreadsheet.page.scss'],
})
export class CrdtSpreadsheetPage implements OnInit, OnDestroy, RemoteObserver<Payload> {
  private spreadsheetService: SpreadsheetService;
  private _currentCell: CellDto;
  private channelName: string = 'spreadsheet';
  private communicationService: CommunicationService<Payload>;
  private applicationRef: ApplicationRef;
  private _messageList: Message<Payload>[] = [];

  constructor(communicationService: CommunicationService<Payload>, raftService: RaftService, applicationRef: ApplicationRef, spreadsheetService: SpreadsheetService) {
    this.spreadsheetService = spreadsheetService;
    this._currentCell = this.spreadsheetService.getCellByIndex(0, 0);
    this.applicationRef = applicationRef;
    this.communicationService = communicationService;
  }


  ngOnInit() {
    this.communicationService.openChannel(this.channelName, this);
  }

  ngOnDestroy() {
    this.communicationService.closeChannel();
    this.spreadsheetService.init();
  }

  public selectCell(colId: string, rowId: string) {
    this._currentCell = this.spreadsheetService.getCellById(Address.of(colId, rowId));
  }

  public addRow() {
    let id = this.identifier.next();
    let message = new MessageBuilder()
      .sender(this.identifier.uuid)
      .action(Action.ADD_ROW)
      .input(id)
      .build();
    if (message === undefined) {
      console.warn('addRow cant build message')
      return
    }
    this.spreadsheetService.addRow(id);
    this.nodes.forEach(destination => {
      message!.destination = destination;
      this.communicationService.postMessage(message!);
    })
    this.messageList.unshift(message);
  }

  public insertRow(row: string) {
    let id = this.identifier.next();
    let message = new MessageBuilder()
      .sender(this.identifier.uuid)
      .action(Action.INSERT_ROW)
      .address(Address.of('', row))
      .input(id)
      .build();
    if (message === undefined) {
      console.warn('insertRow cant build message')
      return
    }
    this.spreadsheetService.insertRow(id, row);
    this.nodes.forEach(destination => {
      message!.destination = destination;
      this.communicationService.postMessage(message!);
    })
    this.messageList.unshift(message);
  }

  public deleteRow(row: string) {
    let message = new MessageBuilder()
      .sender(this.identifier.uuid)
      .action(Action.DELETE_ROW)
      .address(Address.of('', row))
      .build();
    if (message === undefined) {
      console.warn('deleteRow cant build message')
      return
    }
    this.spreadsheetService.deleteRow(row);
    this.nodes.forEach(destination => {
      message!.destination = destination;
      this.communicationService.postMessage(message!);
    })
    this.messageList.unshift(message);
  }

  public addColumn() {
    let id = this.identifier.next();
    let message = new MessageBuilder()
      .sender(this.identifier.uuid)
      .action(Action.ADD_COLUMN)
      .input(id)
      .build();
    if (message === undefined) {
      console.warn('addColumn cant build message')
      return
    }
    this.spreadsheetService.addColumn(id);
    this.nodes.forEach(destination => {
      message!.destination = destination;
      this.communicationService.postMessage(message!);
    })
    this.messageList.unshift(message);
  }

  public insertColumn(column: string) {
    let id = this.identifier.next();
    let message = new MessageBuilder()
      .sender(this.identifier.uuid)
      .action(Action.INSERT_COLUMN)
      .address(Address.of(column, ''))
      .input(id)
      .build();
    if (message === undefined) {
      console.warn('insertColumn cant build message')
      return
    }
    this.spreadsheetService.insertColumn(id, column);
    this.nodes.forEach(destination => {
      message!.destination = destination;
      this.communicationService.postMessage(message!);
    })
    this.messageList.unshift(message);
  }

  public deleteColumn(column: string) {
    let message = new MessageBuilder()
      .sender(this.identifier.uuid)
      .action(Action.DELETE_COLUMN)
      .address(Address.of(column, ''))
      .build();
    if (message === undefined) {
      console.warn('deleteColumn cant build message')
      return
    }
    this.spreadsheetService.deleteColumn(column);
    this.nodes.forEach(destination => {
      message!.destination = destination;
      this.communicationService.postMessage(message!);
    })
    this.messageList.unshift(message);
  }

  public insertCell(cell: CellDto) {
    let message = new MessageBuilder()
      .sender(this.identifier.uuid)
      .action(Action.INSERT_CELL)
      .address(cell.address)
      .input(cell.input)
      .build();
    if (message === undefined) {
      console.warn('insertCell cant build message')
      return
    }
    this.spreadsheetService.insertCell(cell);
    this.nodes.forEach(destination => {
      message!.destination = destination;
      this.communicationService.postMessage(message!);
    })
    this.messageList.unshift(message);
  }

  public deleteCell(cell: CellDto) {
    cell.input = '';
    this.insertCell(cell);
  }

  public getCell(column: string, row: string): Cell | undefined {
    return this.spreadsheetService.renderTable().get(Address.of(column, row));
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

  public onMessage(message: Message<Payload>) {
    if (message.payload === undefined || !isPayload(message.payload)) {
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

  private performAction(message: Message<Payload>) {
    switch (message.payload?.action) {
      case Action.INSERT_CELL:
        let address = new Address(message.payload.column!, message.payload.row!);
        let cell = new CellDto(address, message.payload.input!);
        this.spreadsheetService.insertCell(cell);
        break;
      case Action.ADD_ROW:
        this.spreadsheetService.addRow(message.payload.input!);
        break;
      case Action.INSERT_ROW:
        this.spreadsheetService.insertRow(message.payload.input!, message.payload.row!)
        break;
      case Action.ADD_COLUMN:
        this.spreadsheetService.addColumn(message.payload.input!);
        break;
      case Action.INSERT_COLUMN:
        this.spreadsheetService.insertColumn(message.payload.input!, message.payload.column!);
        break;
      case Action.DELETE_COLUMN:
        this.spreadsheetService.deleteColumn(message.payload.column!);
        break;
      case Action.DELETE_ROW:
        this.spreadsheetService.deleteRow(message.payload.row!)
        break;
      default:
        console.warn('Cant perform action for message: ', message);
        break;
    }
  }


  get messageList(): Message<Payload>[] {
    return this._messageList;
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
}
