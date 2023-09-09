import {Component} from '@angular/core';
import {RaftService} from "../../raft/controller/raft.service";
import {Action, isPayload} from "../../spreadsheet/util/Action";
import {RaftServiceObserver} from "../../raft/util/RaftServiceObserver";
import {RaftMetaData} from "../../raft/util/RaftMetaData";
import {ConsistencyCheckerService} from "../../consistency-checker/consistency-checker.service";
import {AlertController} from "@ionic/angular";
import {TestEnvironment} from "../../test-environment/TestEnvironment";
import {OutputCell} from "../../spreadsheet/domain/OutputCell";
import {RaftSpreadsheetService} from "../../raft-spreadsheet/raft-spreadsheet.service";

@Component({
  selector: 'app-consistent-spreadsheet',
  templateUrl: './consistent-spreadsheet.page.html',
  styleUrls: ['./consistent-spreadsheet.page.scss'],
})
export class ConsistentSpreadsheetPage extends TestEnvironment<Action> implements RaftServiceObserver<Action> {
  private static readonly TAG: string = 'consistent';
  private _raftMetaData: RaftMetaData = {term: 0, role: '', lastLogIndex: 0, commitIndex: 0, lastAppliedLog: 0};

  constructor(
    private raftService: RaftService<Action>,
    private alertController: AlertController,
    spreadsheetService: RaftSpreadsheetService,
    consistencyChecker: ConsistencyCheckerService<OutputCell>
  ) {
    super(consistencyChecker, raftService, spreadsheetService, ConsistentSpreadsheetPage.TAG);
    this.raftService.openChannel(ConsistentSpreadsheetPage.TAG, this);
    this.startTimeMeasuring();
  }

  public start() {
    this.raftService.start();
  }

  public override grow(quantity: number) {
    if (!this.raftService.isActive() || !this.raftService.isConnected) {
      this.presentAlert().finally();
      return;
    }
    super.grow(quantity);
  }

  public override clear() {
    if (!this.raftService.isActive() || !this.raftService.isConnected) {
      this.presentAlert().finally();
      return;
    }
    super.clear();
  }

  public override startTests() {
    if (!this.raftService.isActive() || !this.raftService.isConnected) {
      this.presentAlert().finally();
      return;
    }
    super.startTests();
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
        message: `connection enabled: ${this.raftService.isConnected}/true connected nodes: ${this.raftService.nodes.size}/3`,
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
        message: `connection enabled: ${this.raftService.isConnected}/true connected nodes: ${this.raftService.nodes.size}/3`,
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
    this._raftMetaData = state;
  }


  public canBeStarted(): boolean {
    return this.raftService.canBeStarted();
  }


  public get raftMetaData(): RaftMetaData {
    this._raftMetaData = this.raftService.getMetaData();
    return this._raftMetaData;
  }

  public get isActive(): boolean {
    return this.raftService.isActive();
  }
}
