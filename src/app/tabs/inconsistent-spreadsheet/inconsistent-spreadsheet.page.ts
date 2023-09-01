import {Component} from '@angular/core';
import {SpreadsheetService} from "../../spreadsheet/controller/spreadsheet.service";
import {BroadcastService} from "../../communication/controller/broadcast.service";
import {ActionType} from "../../spreadsheet/util/ActionType";
import {Action, isPayload} from "../../spreadsheet/util/Action";
import {Address} from "../../spreadsheet/domain/Address";
import {Table} from "../../spreadsheet/domain/Table";
import {ConsistencyCheckerService} from "../../consistency-checker/consistency-checker.service";
import {SpreadsheetPage} from "../SpreadsheetPage";
import {OutputCell} from "../../spreadsheet/domain/OutputCell";

@Component({
  selector: 'app-inconsistent-spreadsheet',
  templateUrl: './inconsistent-spreadsheet.page.html',
  styleUrls: ['./inconsistent-spreadsheet.page.scss'],
})
export class InconsistentSpreadsheetPage extends SpreadsheetPage<Action> {
  private static readonly TAG: string = 'inconsistent';

  constructor(
    private communicationService: BroadcastService<Action>,
    private spreadsheetService: SpreadsheetService,
    consistencyChecker: ConsistencyCheckerService<OutputCell>
  ) {
    super(consistencyChecker, communicationService, InconsistentSpreadsheetPage.TAG);
    const address = this.spreadsheetService.renderTable().getAddressByIndex(0, 0);
    if (address !== undefined) {
      this.selectCell(address.column, address.row);
    }
  }

  public ionViewDidEnter() {
    this.communicationService.openChannel(InconsistentSpreadsheetPage.TAG, this);
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

  public override onMessage(message: Action) {
    if (!isPayload(message)) {
      console.warn('Invalid message', message);
      return;
    }
    super.onMessage(message);
  }

  protected override handleMessage(action: Action) {
    switch (action.action) {
      case ActionType.INSERT_CELL:
        const address: Address = {column: action.column!, row: action.row!};
        this.spreadsheetService.insertCellById(address, action.input!);
        break;
      case ActionType.ADD_ROW:
        this.spreadsheetService.addRow(action.input!);
        break;
      case ActionType.INSERT_ROW:
        this.spreadsheetService.insertRow(action.input!, action.row!)
        break;
      case ActionType.ADD_COLUMN:
        this.spreadsheetService.addColumn(action.input!);
        break;
      case ActionType.INSERT_COLUMN:
        this.spreadsheetService.insertColumn(action.input!, action.column!);
        break;
      case ActionType.DELETE_COLUMN:
        this.spreadsheetService.deleteColumn(action.column!);
        break;
      case ActionType.DELETE_ROW:
        this.spreadsheetService.deleteRow(action.row!)
        break;
      default:
        console.warn('Cant perform action for action: ', action);
        break;
    }
  }

  public override renderTable(): Table<OutputCell> {
    return this.spreadsheetService.renderTable();
  }

}

