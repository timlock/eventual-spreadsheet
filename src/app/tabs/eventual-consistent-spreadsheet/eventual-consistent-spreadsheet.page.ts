import {Component, NgZone, OnInit} from '@angular/core';
import {CellDto} from "../../spreadsheet/controller/CellDto";
import {CommunicationService} from "../../communication/controller/communication.service";
import {Identifier} from "../../Identifier";
import {CommunicationServiceObserver} from "../../communication/controller/CommunicationServiceObserver";
import {CrdtSpreadsheetService} from "../../crdt-spreadsheet/controller/crdt-spreadsheet.service";
import {Cell} from "../../spreadsheet/domain/Cell";
import {Table} from "../../spreadsheet/domain/Table";

@Component({
  selector: 'app-eventual-consistent-spreadsheet',
  templateUrl: './eventual-consistent-spreadsheet.page.html',
  styleUrls: ['./eventual-consistent-spreadsheet.page.scss'],
})
export class EventualConsistentSpreadsheetPage implements OnInit, CommunicationServiceObserver<Uint8Array> {
  private communicationService: CommunicationService<Uint8Array>;
  private spreadsheetService: CrdtSpreadsheetService;
  private ngZone: NgZone;
  private _table: Table<Cell>;
  private _currentCell: CellDto;
  private _nodes: Set<string> = new Set<string>();
  private channelName: string = 'eventual-consistent';
  private ionInput: any | undefined;

  constructor(
    communicationService: CommunicationService<Uint8Array>,
    spreadsheetService: CrdtSpreadsheetService,
    ngZone: NgZone
  ) {
    this.communicationService = communicationService;
    this.spreadsheetService = spreadsheetService;
    this.ngZone = ngZone;
    this._table = this.spreadsheetService.getTable();
    this._currentCell = this.spreadsheetService.getCellByIndex(1, 1);

  }


  ngOnInit() {
    this.communicationService.openChannel(this.channelName, this);
  }

  public ngAfterViewInit() {
    this.ionInput = document.getElementsByName('input')[0];
  }

  public selectCell(colId: string, rowId: string) {
    this._currentCell = this.spreadsheetService.getCellById({column: colId, row: rowId});
    if (this.table.rows.length > 0 && this.table.columns.length > 0) {
      this.ionInput?.setFocus();
    }
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
    let update = this.spreadsheetService.insertCellById(cell.address, cell.input);
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


  get currentCell(): CellDto {
    if (this.table.rows.indexOf(this._currentCell.row) === -1 || this.table.columns.indexOf(this._currentCell.column) === -1) {
      this.selectCell(this.table.columns[0], this.table.rows[0]);
    }
    return this._currentCell;
  }

  public onMessage(message: Uint8Array, source: string) {
    console.log(message, source);
    this.spreadsheetService.applyUpdate(message);
    this.ngZone.run(() => this._table = this.spreadsheetService.getTable());
  }

  public onNode(nodeId: string) {
    let update = this.spreadsheetService.getEncodedState();
    if (update === undefined) {
      console.warn('Update is undefined');
      return;
    }
    this.communicationService.send(update, nodeId);
    this.ngZone.run(() => this._nodes = this.communicationService.nodes);
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

  get table(): Table<Cell> {
    this._table = this.spreadsheetService.getTable();
    return this._table;
  }
}
