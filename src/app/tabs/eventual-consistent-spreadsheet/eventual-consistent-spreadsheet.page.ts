import {AfterViewInit, Component, NgZone} from '@angular/core';
import {CellDto} from "../../spreadsheet/controller/CellDto";
import {CommunicationService} from "../../communication/controller/communication.service";
import {Identifier} from "../../identifier/Identifier";
import {CommunicationServiceObserver} from "../../communication/controller/CommunicationServiceObserver";
import {CrdtSpreadsheetService} from "../../crdt-spreadsheet/controller/crdt-spreadsheet.service";
import {Cell} from "../../spreadsheet/domain/Cell";
import {Table} from "../../spreadsheet/domain/Table";
import {ConsistencyCheckerService} from "../../consistency-checker/consistency-checker.service";

@Component({
  selector: 'app-eventual-consistent-spreadsheet',
  templateUrl: './eventual-consistent-spreadsheet.page.html',
  styleUrls: ['./eventual-consistent-spreadsheet.page.scss'],
})
export class EventualConsistentSpreadsheetPage implements AfterViewInit, CommunicationServiceObserver<Uint8Array> {
  private _table: Table<Cell>;
  private _currentCell: CellDto;
  private _nodes: Set<string> = new Set<string>();
  private channelName: string = 'eventual-consistent';
  private ionInput: any | undefined;
  private _trackedTime: number | undefined;
  private _receivedMessageCounter = 0;
  private _sentMessageCounter = 0;
    private modifiedState: boolean = false;
  private _growQuantity: number = 0;

  constructor(
    private communicationService: CommunicationService<Uint8Array>,
    private spreadsheetService: CrdtSpreadsheetService,
    private ngZone: NgZone,
    private consistencyChecker: ConsistencyCheckerService
  ) {
    this._table = this.spreadsheetService.getTable();
    this._currentCell = this.spreadsheetService.getCellByIndex(1, 1);
    this.consistencyChecker.subscribe(this.communicationService.identifier.uuid, this.table, (time: number) => {
      console.log('All updates applied ', time);
      this.ngZone.run(() => this._trackedTime = time);
    });
  }


  public ngAfterViewInit() {
    this.ionInput = document.getElementsByName('eventual-consistent-input')[0];
  }


  public ionViewDidEnter() {
    this.communicationService.openChannel(this.channelName, this);
  }


  public selectCell(colId: string, rowId: string) {
    this._currentCell = this.spreadsheetService.getCellById({column: colId, row: rowId});
    if (this.table.rows.length > 0 && this.table.columns.length > 0) {
      this.ionInput?.setFocus();
    }
  }


  public addRow() {
    let id = this.identifier.next();
    this.performAction(() => this.spreadsheetService.addRow(id));
  }

  public insertRow(row: string) {
    let id = this.identifier.next();
    this.performAction(() => this.spreadsheetService.insertRow(id, row));
  }

  public deleteRow(row: string) {
    this.performAction(() => this.spreadsheetService.deleteRow(row));
  }

  public addColumn() {
    let id = this.identifier.next();
    this.performAction(() => this.spreadsheetService.addColumn(id));
  }

  public insertColumn(column: string) {
    let id = this.identifier.next();
    this.performAction(() => this.spreadsheetService.insertColumn(id, column));
  }

  public deleteColumn(column: string) {
    this.performAction(() => this.spreadsheetService.deleteColumn(column));
  }

  public insertCell(cell: CellDto) {
    this.performAction(() => this.spreadsheetService.insertCellById(cell.address, cell.input));
  }

  private performAction(action: () => Uint8Array | undefined) {
    if (this.isConnected) {
      this.consistencyChecker.submittedState();
      this.modifiedState = false;
    } else {
      this.modifiedState = true;
    }
    this.ngZone.run(() => this._trackedTime = undefined);
    let update = action();
    this.consistencyChecker.updateApplied(this.table);
    if (update === undefined) {
      console.warn('Update is undefined');
      return;
    }
    this.communicationService.send(update);
  }

  public clear() {
    for (let column of this.spreadsheetService.columns) {
      for (let row of this.spreadsheetService.rows) {
        let cell = this.spreadsheetService.getCellById({column: column, row: row});
        this.deleteCell(cell);
      }
    }
    let rows = Array.from(this.spreadsheetService.rows);
    for (let row of rows) {
      this.deleteRow(row);
    }
    let columns = Array.from(this.spreadsheetService.columns);
    for (let column of columns) {
      this.deleteColumn(column);
    }
  }

  public grow(quantity: number) {
    console.log('Grow', quantity)
    for (let i = 0; i < quantity; i++) {
      this.addColumn();
      this.addRow();
    }
  }

  public fillTable() {
    for (let colIndex = 0; colIndex < this.spreadsheetService.columns.length; colIndex++) {
      for (let rowIndex = 0; rowIndex < this.spreadsheetService.rows.length; rowIndex++) {
        let address = this.spreadsheetService.getAddressByIndex(colIndex, rowIndex);
        if (address === undefined) {
          console.warn(`Cant get address for index column: ${colIndex} index row: ${rowIndex}`)
          return;
        }
        let cell = new CellDto(address, colIndex, rowIndex, this.identifier.next());
        this.insertCell(cell);
      }
    }
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

  public onMessageCounterUpdate(received: number, total: number) {
    this.ngZone.run(() => {
      this._receivedMessageCounter = received;
      this._sentMessageCounter = total;
    });
  }

  public onMessage(message: Uint8Array) {
    this.consistencyChecker.submittedState();
    this.spreadsheetService.applyUpdate(message);
    this.consistencyChecker.updateApplied(this.spreadsheetService.getTable());
    this.ngZone.run(() => this._table = this.spreadsheetService.getTable());
  }

  public onNode(nodeId: string) {
    let update = this.spreadsheetService.getEncodedState();
    if (update === undefined) {
      console.warn('Update is undefined');
      return;
    }
    this.communicationService.send(update, nodeId);
    this.ngZone.run(() => this._nodes.add(nodeId));
    this.consistencyChecker.addNodes(nodeId);
  }


  get nodes(): Set<string> {
    return this._nodes;
  }

  get identifier(): Identifier {
    return this.communicationService.identifier;
  }

  get isConnected(): boolean {
    return this.communicationService.isConnected;
  }

  set isConnected(enabled: boolean) {
    if (enabled && this.modifiedState) {
      this.consistencyChecker.submittedState();
      this.modifiedState = false;
    }
    this.communicationService.isConnected = enabled;
  }

  get table(): Table<Cell> {
    this._table = this.spreadsheetService.getTable();
    return this._table;
  }

  get trackedTime(): number | undefined {
    return this._trackedTime;
  }

  get receivedMessageCounter(): number {
    this._receivedMessageCounter = this.communicationService.receivedMessageCounter;
    return this._receivedMessageCounter;
  }

  get sentMessageCounter(): number {
    this._sentMessageCounter = this.communicationService.sentMessageCounter;
    return this._sentMessageCounter;
  }

  get growQuantity(): number {
    return this._growQuantity;
  }

  set growQuantity(value: number) {
    this._growQuantity = value;
  }
}
