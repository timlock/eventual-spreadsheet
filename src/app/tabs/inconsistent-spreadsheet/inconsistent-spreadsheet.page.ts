import {ApplicationRef, Component, NgZone} from '@angular/core';
import {SpreadsheetService} from "../../spreadsheet/controller/spreadsheet.service";
import {BroadcastService} from "../../communication/controller/broadcast.service";
import {Action, isPayload} from "../../spreadsheet/util/Action";
import {ConsistencyCheckerService} from "../../test-environment/consistency-checker.service";
import {TestEnvironment} from "../../test-environment/TestEnvironment";
import {OutputCell} from "../../spreadsheet/domain/OutputCell";
import {WebSocketService} from "../../communication/controller/websocket-service";
import {WebrtcService} from "../../communication/controller/webrtc-service";

@Component({
  selector: 'app-inconsistent-spreadsheet',
  templateUrl: './inconsistent-spreadsheet.page.html',
  styleUrls: ['./inconsistent-spreadsheet.page.scss'],
})
export class InconsistentSpreadsheetPage extends TestEnvironment<Action>{
  private static readonly TAG: string = 'inconsistent';

  constructor(
    // webRTC: WebrtcService<Action>,
    broadcastService: BroadcastService<Action>,
    // websocketService: WebSocketService<Action>,
    spreadsheetService: SpreadsheetService,
    consistencyChecker: ConsistencyCheckerService<OutputCell>,
    applicationRef: ApplicationRef
  ) {
    super(consistencyChecker, broadcastService, spreadsheetService, InconsistentSpreadsheetPage.TAG, applicationRef);

  }

  public override onMessage(message: Action, delay?: number) {
    if (!isPayload(message)) {
      console.warn('Invalid message', message);
      return;
    }
    super.onMessage(message, delay);
  }

}

