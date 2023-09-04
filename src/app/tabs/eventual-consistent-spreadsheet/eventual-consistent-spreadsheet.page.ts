import {Component} from '@angular/core';
import {BroadcastService} from "../../communication/controller/broadcast.service";
import {CrdtSpreadsheetService} from "../../crdt-spreadsheet/controller/crdt-spreadsheet.service";
import {Table} from "../../spreadsheet/domain/Table";
import {ConsistencyCheckerService} from "../../consistency-checker/consistency-checker.service";
import {TestEnvironment} from "../TestEnvironment";
import {Address} from "../../spreadsheet/domain/Address";
import {OutputCell} from "../../spreadsheet/domain/OutputCell";

@Component({
  selector: 'app-eventual-consistent-spreadsheet',
  templateUrl: './eventual-consistent-spreadsheet.page.html',
  styleUrls: ['./eventual-consistent-spreadsheet.page.scss'],
})
export class EventualConsistentSpreadsheetPage extends TestEnvironment<Uint8Array> {
  private static readonly TAG: string = 'eventual-consistent';


  constructor(
    private communicationService: BroadcastService<Uint8Array>,
    private spreadsheetService: CrdtSpreadsheetService,
    consistencyChecker: ConsistencyCheckerService<OutputCell>
  ) {
    super(consistencyChecker, communicationService, EventualConsistentSpreadsheetPage.TAG);
    const address = this.spreadsheetService.renderTable().getAddressByIndex(0, 0);
    if (address !== undefined) {
      this.selectCell(address.column, address.row);
    }
  }


  public ionViewDidEnter() {
    this.communicationService.openChannel(EventualConsistentSpreadsheetPage.TAG, this);
    this.startTimeMeasuring();
  }


  public override addRow() {
    const id = this.communication.identifier.next();
    this.performAction(() => this.spreadsheetService.addRow(id));
  }

  public override insertRow(row: string) {
    const id = this.communication.identifier.next();
    this.performAction(() => this.spreadsheetService.insertRow(id, row));
  }

  public override deleteRow(row: string) {
    this.performAction(() => this.spreadsheetService.deleteRow(row));
  }

  public override addColumn() {
    const id = this.communication.identifier.next();
    this.performAction(() => this.spreadsheetService.addColumn(id));
  }

  public override insertColumn(column: string) {
    const id = this.communication.identifier.next();
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


  public override renderTable(): Table<OutputCell> {
    return this.spreadsheetService.renderTable();
  }

  protected override handleMessage(message: Uint8Array): void {
    this.spreadsheetService.applyUpdate(message);
  }
}
