import {Component} from '@angular/core';
import {BroadcastService} from "../../communication/controller/broadcast.service";
import {CrdtSpreadsheetService} from "../../crdt-spreadsheet/controller/crdt-spreadsheet.service";
import {Table} from "../../spreadsheet/domain/Table";
import {ConsistencyCheckerService} from "../../consistency-checker/consistency-checker.service";
import {TestEnvironment} from "../../test-environment/TestEnvironment";
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
    spreadsheetService: CrdtSpreadsheetService,
    consistencyChecker: ConsistencyCheckerService<OutputCell>
  ) {
    super(consistencyChecker, communicationService, spreadsheetService, EventualConsistentSpreadsheetPage.TAG);

  }


  public ionViewDidEnter() {
    this.communicationService.openChannel(EventualConsistentSpreadsheetPage.TAG, this);
    this.startTimeMeasuring();
  }
}
