import {AfterViewInit, Component, NgZone} from '@angular/core';
import {BroadcastService} from "../../communication/controller/broadcast.service";
import {Identifier} from "../../identifier/Identifier";
import {CrdtSpreadsheetService} from "../../crdt-spreadsheet/controller/crdt-spreadsheet.service";
import {Cell} from "../../spreadsheet/domain/Cell";
import {Table} from "../../spreadsheet/domain/Table";
import {ConsistencyCheckerService} from "../../consistency-checker/consistency-checker.service";
import {SpreadsheetPage} from "../SpreadsheetPage";
import {Address} from "../../spreadsheet/domain/Address";

@Component({
  selector: 'app-eventual-consistent-spreadsheet',
  templateUrl: './eventual-consistent-spreadsheet.page.html',
  styleUrls: ['./eventual-consistent-spreadsheet.page.scss'],
})
export class EventualConsistentSpreadsheetPage extends SpreadsheetPage<Uint8Array> implements AfterViewInit {
  private channelName: string = 'eventual-consistent';
  private ionInput: any | undefined;

  constructor(
    private communicationService: BroadcastService<Uint8Array>,
    private spreadsheetService: CrdtSpreadsheetService,
    ngZone: NgZone,
    consistencyChecker: ConsistencyCheckerService
  ) {
    super(ngZone, consistencyChecker, communicationService);
    this._currentCell = this.spreadsheetService.getCellByIndex(1, 1);
    this.consistencyChecker.subscribe(this.communicationService.identifier.uuid, this.table, (time: number) => {
      console.log('All updates applied ', time);
      this.ngZone.run(() => this.trackedTime = time);
    });

  }


  public ngAfterViewInit() {
    this.ionInput = document.getElementsByName('eventual-consistent-input')[0];
  }


  public ionViewDidEnter() {
    this.communicationService.openChannel(this.channelName, this);
  }


  public override selectCell(colId: string, rowId: string) {
    this._currentCell = this.spreadsheetService.getCellById({column: colId, row: rowId});
    if (this.table.rows.length > 0 && this.table.columns.length > 0) {
      this.ionInput?.setFocus();
    }
  }


  public override addRow() {
    let id = this.identifier.next();
    this.performAction(() => this.spreadsheetService.addRow(id));
  }

  public override insertRow(row: string) {
    let id = this.identifier.next();
    this.performAction(() => this.spreadsheetService.insertRow(id, row));
  }

  public override deleteRow(row: string) {
    this.performAction(() => this.spreadsheetService.deleteRow(row));
  }

  public override addColumn() {
    let id = this.identifier.next();
    this.performAction(() => this.spreadsheetService.addColumn(id));
  }

  public override insertColumn(column: string) {
    let id = this.identifier.next();
    this.performAction(() => this.spreadsheetService.insertColumn(id, column));
  }

  public override deleteColumn(column: string) {
    this.performAction(() => this.spreadsheetService.deleteColumn(column));
  }

  public override insertCell(address: Address, input: string) {
    this.performAction(() => this.spreadsheetService.insertCellById(address, input));
  }

  public override deleteCell(address: Address) {
    this.insertCell(address, '');
  }

  override get identifier(): Identifier {
    return this.communicationService.identifier;
  }


  override get table(): Table<Cell> {
    return this.spreadsheetService.getTable();
  }

  protected handleMessage(message: Uint8Array): void {
    this.spreadsheetService.applyUpdate(message);
  }
}
