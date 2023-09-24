import {Identifier} from "../identifier/Identifier";
import {CommunicationObserver} from "../communication/controller/CommunicationObserver";

export interface Communication<T> {
  send(update: T): void;

  openChannel(channelName: string, observer: CommunicationObserver<T>): void;

  get isConnected(): boolean;

  set isConnected(enabled: boolean);

  get identifier(): Identifier;

  get totalBytes(): number;

  get countedMessages(): number;

  get totalReceivedMessages(): number;

  get totalSentMessages(): number;

  get nodes(): Set<string>;

  get countBytes(): boolean;

  set countBytes(value: boolean);

  get delay(): number;

  set delay(value: number);
}
