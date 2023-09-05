import {Component} from '@angular/core';
import {SpreadsheetService} from "../../spreadsheet/controller/spreadsheet.service";
import {BroadcastService} from "../../communication/controller/broadcast.service";
import {Action, isPayload} from "../../spreadsheet/util/Action";
import {ConsistencyCheckerService} from "../../consistency-checker/consistency-checker.service";
import {TestEnvironment} from "../../test-environment/TestEnvironment";
import {OutputCell} from "../../spreadsheet/domain/OutputCell";

@Component({
  selector: 'app-inconsistent-spreadsheet',
  templateUrl: './inconsistent-spreadsheet.page.html',
  styleUrls: ['./inconsistent-spreadsheet.page.scss'],
})
export class InconsistentSpreadsheetPage extends TestEnvironment<Action> {
  private static readonly TAG: string = 'inconsistent';

  constructor(
    private communicationService: BroadcastService<Action>,
    spreadsheetService: SpreadsheetService,
    consistencyChecker: ConsistencyCheckerService<OutputCell>
  ) {
    super(consistencyChecker, communicationService, spreadsheetService, InconsistentSpreadsheetPage.TAG);
  }

  public ionViewDidEnter() {
    this.communicationService.openChannel(InconsistentSpreadsheetPage.TAG, this);
    this.startTimeMeasuring();
  }

  public override onMessage(message: Action) {
    if (!isPayload(message)) {
      console.warn('Invalid message', message);
      return;
    }
    super.onMessage(message);
  }

}

