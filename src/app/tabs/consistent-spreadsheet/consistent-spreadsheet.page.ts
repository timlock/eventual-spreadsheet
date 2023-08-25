import {AfterViewInit, Component, NgZone} from '@angular/core';
import {SpreadsheetService} from "../../spreadsheet/controller/spreadsheet.service";
import {RaftService} from "../../raft/controller/raft.service";
import {ActionType} from "../../spreadsheet/util/ActionType";
import {Action, isPayload} from "../../spreadsheet/util/Action";
import {RaftServiceObserver} from "../../raft/util/RaftServiceObserver";
import {Address} from "../../spreadsheet/domain/Address";
import {PayloadFactory} from "../../spreadsheet/util/PayloadFactory";
import {Table} from "../../spreadsheet/domain/Table";
import {RaftMetaData} from "../../raft/util/RaftMetaData";
import {ConsistencyCheckerService} from "../../consistency-checker/consistency-checker.service";
import {AlertController} from "@ionic/angular";
import {SpreadsheetPage} from "../SpreadsheetPage";
import {CellDto} from "../../spreadsheet/controller/CellDto";

@Component({
  selector: 'app-consistent-spreadsheet',
  templateUrl: './consistent-spreadsheet.page.html',
  styleUrls: ['./consistent-spreadsheet.page.scss'],
})
export class ConsistentSpreadsheetPage extends SpreadsheetPage<Action> implements AfterViewInit, RaftServiceObserver<Action> {
  private channelName: string = 'consistent';
  private ionInput: any | undefined;
  private _raftMetaData: RaftMetaData = {term: 0, role: '', lastLogIndex: 0};

  constructor(
    private raftService: RaftService<Action>,
    private alertController: AlertController,
    private spreadsheetService: SpreadsheetService,
    ngZone: NgZone,
    consistencyChecker: ConsistencyCheckerService<CellDto>,
  ) {
    super(ngZone, consistencyChecker, raftService);
    const address = this.spreadsheetService.getTable().getAddressByIndex(0, 0)!;
    this.selectCell(address?.column, address?.row);
  }


  public ngAfterViewInit() {
    this.ionInput = document.getElementsByName('consistent-input')[0];
  }


  public ionViewDidEnter() {
    this.raftService.openChannel(this.channelName, this);
    this.startTimeMeasuring();
  }

  public start() {
    this.raftService.start();
  }


  public override selectCell(column: string, row: string) {
    if (this.table.rows.length > 0 && this.table.columns.length > 0) {
      const address: Address = {column: column, row: row};
      this.currentCell = this.spreadsheetService.getTable().get(address)
      if (this.currentCell === undefined) {
        const index = this.spreadsheetService.getTable().getIndexByAddress(address);
        if (index === undefined) {
          console.warn(`Cant select cell ${column}|${row}`);
          return;
        }
        this.currentCell = {address: address, columnIndex: index[0], rowIndex: index[1], input: '', content: ''};
      }
      this.input = this.currentCell.input;
      this.ionInput?.setFocus();
    }
    console.warn(`Cant select cell ${column}|${row}`);
  }

  public override addRow() {
    const id = this.communication.identifier.next();
    const message = PayloadFactory.addRow(id);
    this.performAction(() => message);
  }

  public override insertRow(row: string) {
    const id = this.communication.identifier.next();
    const message = PayloadFactory.insertRow(id, row);
    this.performAction(() => message);
  }

  public override deleteRow(row: string) {
    const message = PayloadFactory.deleteRow(row);
    this.performAction(() => message);
  }

  public override addColumn() {
    const id = this.communication.identifier.next();
    const message = PayloadFactory.addColumn(id);
    this.performAction(() => message);
  }

  public override insertColumn(column: string) {
    const id = this.communication.identifier.next();
    const message = PayloadFactory.insertColumn(id, column);
    this.performAction(() => message);
  }

  public override deleteColumn(column: string) {
    const message = PayloadFactory.deleteColumn(column);
    this.performAction(() => message);
  }

  public override insertCell(address: Address, input: string) {
    const message = PayloadFactory.insertCell(address, input);
    this.performAction(() => message)
  }

  public override deleteCell(address: Address) {
    this.insertCell(address, '');
  }

  protected override performAction(action: () => Action) {
    if (!this.raftService.isActive() || !this.raftService.isConnected) {
      this.presentAlert().finally();
      return;
    }
    super.performAction(action);
  }

  private async presentAlert() {
    let alert;
    if (!this.raftService.isConnected && this.raftService.isActive()) {
      alert = await this.alertController.create({
        header: 'Can not alter spreadsheet!',
        subHeader: 'Connection must be enabled',
        message: `Connection enabled: ${this.raftService.isConnected}`,
        buttons: ['OK'],
      });
    } else if (this.canBeStarted()) {
      alert = await this.alertController.create({
        header: 'Can not alter spreadsheet!',
        subHeader: 'Raft needs to be started first',
        message: `connection enabled: ${this.raftService.isConnected}/true connected nodes: ${this.nodes.size}/3`,
        buttons: [{
          text: 'Cancel',
          role: 'cancel'
        },
          {
            text: 'Start raft',
            role: 'confirm',
            handler: () => {
              this.raftService.start();
            },
          },],
      });
    } else {
      alert = await this.alertController.create({
        header: 'Can not alter spreadsheet!',
        subHeader: 'Raft needs to be started first',
        message: `connection enabled: ${this.raftService.isConnected}/true connected nodes: ${this.nodes.size}/3`,
        buttons: ['OK'],
      });
    }
    await alert.present();
  }


  public override onMessage(message: Action) {
    if (!isPayload(message)) {
      console.warn('Invalid message', message);
      return;
    }
    super.onMessage(message);
  }

  public onStateChange(state: RaftMetaData) {
    this.ngZone.run(() => this._raftMetaData = state);
  }

  protected override handleMessage(message: Action) {
    switch (message.action) {
      case ActionType.INSERT_CELL:
        const address: Address = {column: message.column!, row: message.row!};
        this.spreadsheetService.insertCellById(address, message.input!);
        break;
      case ActionType.ADD_ROW:
        this.spreadsheetService.addRow(message.input!);
        break;
      case ActionType.INSERT_ROW:
        this.spreadsheetService.insertRow(message.input!, message.row!)
        break;
      case ActionType.ADD_COLUMN:
        this.spreadsheetService.addColumn(message.input!);
        break;
      case ActionType.INSERT_COLUMN:
        this.spreadsheetService.insertColumn(message.input!, message.column!);
        break;
      case ActionType.DELETE_COLUMN:
        this.spreadsheetService.deleteColumn(message.column!);
        break;
      case ActionType.DELETE_ROW:
        this.spreadsheetService.deleteRow(message.row!)
        break;
      default:
        console.warn('Cant perform action for message: ', message);
        break;
    }
  }

  public canBeStarted(): boolean {
    return this.raftService.canBeStarted();
  }

  public override get table(): Table<CellDto> {
    return this.spreadsheetService.getTable();
  }


  public get raftMetaData(): RaftMetaData {
    this._raftMetaData = this.raftService.getMetaData();
    return this._raftMetaData;
  }

  public get isActive(): boolean {
    return this.raftService.isActive();
  }
}
