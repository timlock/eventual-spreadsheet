import {ApplicationRef, Component, OnInit} from '@angular/core';
import {CellDto} from "../../spreadsheet/controller/CellDto";
import {CommunicationService} from "../../communication/controller/communication.service";
import {Payload} from "../../spreadsheet/util/Payload";
import {RaftService} from "../../communication/controller/raft.service";
import {Identifier} from "../../Identifier";
import {CommunicationServiceObserver} from "../../communication/controller/CommunicationServiceObserver";
import {CrdtSpreadsheetService} from "../../crdt-spreadsheet/controller/crdt-spreadsheet.service";
import {Cell} from "../../spreadsheet/domain/Cell";

@Component({
  selector: 'app-eventual-consistent-spreadsheet',
  templateUrl: './eventual-consistent-spreadsheet.page.html',
  styleUrls: ['./eventual-consistent-spreadsheet.page.scss'],
})
export class EventualConsistentSpreadsheetPage implements OnInit, CommunicationServiceObserver<Uint8Array> {
  private spreadsheetService: CrdtSpreadsheetService;
  private _currentCell: CellDto;
  private channelName: string = 'spreadsheet';
  private communicationService: CommunicationService<Uint8Array>;
  private applicationRef: ApplicationRef;
  private _messageList: [string, Payload][] = [];

  constructor(communicationService: CommunicationService<Uint8Array>, raftService: RaftService, applicationRef: ApplicationRef, spreadsheetService: CrdtSpreadsheetService) {
    this.spreadsheetService = spreadsheetService;
    this._currentCell = this.spreadsheetService.getCellByIndex(0, 0);
    this.applicationRef = applicationRef;
    this.communicationService = communicationService;
  }


  ngOnInit() {
    this.communicationService.openChannel(this.channelName, this);
  }

  public selectCell(colId: string, rowId: string) {
    this._currentCell = this.spreadsheetService.getCellById({column: colId, row: rowId});
    this.applicationRef.tick();
  }


  public addRow() {
    let id = this.identifier.next();
    let update = this.spreadsheetService.addRow(id);
    if (update === undefined) {
      console.warn('Update is undefined');
      return;
    }
    this.communicationService.send(update);
  }

  public insertRow(row: string) {
    let id = this.identifier.next();
    let update = this.spreadsheetService.insertRow(id, row);
    if (update === undefined) {
      console.warn('Update is undefined');
      return;
    }
    this.communicationService.send(update);

  }

  public deleteRow(row: string) {
    let update = this.spreadsheetService.deleteRow(row);
    if (update === undefined) {
      console.warn('Update is undefined');
      return;
    }
    this.communicationService.send(update);
  }

  public addColumn() {
    let id = this.identifier.next();
    let update = this.spreadsheetService.addColumn(id);
    if (update === undefined) {
      console.warn('Update is undefined');
      return;
    }
    this.communicationService.send(update);
  }

  public insertColumn(column: string) {
    let id = this.identifier.next();
    let update = this.spreadsheetService.insertColumn(id, column);
    if (update === undefined) {
      console.warn('Update is undefined');
      return;
    }
    this.communicationService.send(update);
  }

  public deleteColumn(column: string) {
    let update = this.spreadsheetService.deleteColumn(column);
    if (update === undefined) {
      console.warn('Update is undefined');
      return;
    }
    this.communicationService.send(update);
  }

  public insertCell(cell: CellDto) {
    let update = this.spreadsheetService.insertCell(cell);
    if (update === undefined) {
      console.warn('Update is undefined');
      return;
    }
    this.communicationService.send(update);
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

  public onMessage(message: Uint8Array, source: string) {
    this.spreadsheetService.applyUpdate(message);
    this.applicationRef.tick();
  }

  public onNode(nodeId: string) {
    let update = this.spreadsheetService.getEncodedState();
    if (update === undefined) {
      console.warn('Update is undefined');
      return;
    }
    this.communicationService.send(update, nodeId);
    this.applicationRef.tick();
  }


  get messageList(): [string, Payload][] {
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

  get connectionEnabled(): boolean {
    return this.communicationService.connected;
  }

  set connectionEnabled(enabled: boolean) {
    this.communicationService.connected = enabled;
  }

}
