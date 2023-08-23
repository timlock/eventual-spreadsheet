import {AfterViewInit, Component, NgZone} from '@angular/core';
import {CommunicationServiceObserver} from "../../communication/controller/CommunicationServiceObserver";
import {SpreadsheetService} from "../../spreadsheet/controller/spreadsheet.service";
import {BroadcastService} from "../../communication/controller/broadcast.service";
import {ActionType} from "../../spreadsheet/util/ActionType";
import {Action, isPayload} from "../../spreadsheet/util/Action";
import {Cell} from "../../spreadsheet/domain/Cell";
import {Address} from "../../spreadsheet/domain/Address";
import {PayloadFactory} from "../../spreadsheet/util/PayloadFactory";
import {Table} from "../../spreadsheet/domain/Table";
import {ConsistencyCheckerService} from "../../consistency-checker/consistency-checker.service";
import {SpreadsheetPage} from "../SpreadsheetPage";

@Component({
  selector: 'app-inconsistent-spreadsheet',
  templateUrl: './inconsistent-spreadsheet.page.html',
  styleUrls: ['./inconsistent-spreadsheet.page.scss'],
})
export class InconsistentSpreadsheetPage extends SpreadsheetPage<Action> implements AfterViewInit, CommunicationServiceObserver<Action> {
  private channelName: string = 'inconsistent';
  private ionInput: any | undefined;

  constructor(
    private communicationService: BroadcastService<Action>,
    private spreadsheetService: SpreadsheetService,
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
    this.ionInput = document.getElementsByName('inconsistent-input')[0];
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
    let message = PayloadFactory.addRow(id);
    this.spreadsheetService.addRow(id);
    this.performAction(() => message!);
  }

  public override insertRow(row: string) {
    let id = this.identifier.next();
    let message = PayloadFactory.insertRow(id, row);
    this.spreadsheetService.insertRow(id, row);
    this.performAction(() => message!);
  }

  public override deleteRow(row: string) {
    let message = PayloadFactory.deleteRow(row);
    this.spreadsheetService.deleteRow(row);
    this.performAction(() => message!);
  }

  public override addColumn() {
    let id = this.identifier.next();
    let message = PayloadFactory.addColumn(id);
    this.spreadsheetService.addColumn(id);
    this.performAction(() => message!);
  }

  public override insertColumn(column: string) {
    let id = this.identifier.next();
    let message = PayloadFactory.insertColumn(id, column);
    this.spreadsheetService.insertColumn(id, column);
    this.performAction(() => message!);
  }

  public override deleteColumn(column: string) {
    let message = PayloadFactory.deleteColumn(column);
    this.spreadsheetService.deleteColumn(column);
    this.performAction(() => message!);
  }

  public override insertCell(address: Address, input: string) {
    let message = PayloadFactory.insertCell(address, input);
    this.spreadsheetService.insertCellById(address, input);
    this.performAction(() => message!);
  }

  public override deleteCell(address: Address) {
    this.insertCell(address, '');
  }

  public getCell(column: string, row: string): Cell | undefined {
    return this.spreadsheetService.getTable().get({column: column, row: row});
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
        let address: Address = {column: action.column!, row: action.row!};
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


  get table(): Table<Cell> {
    return this.spreadsheetService.getTable();
  }

}

