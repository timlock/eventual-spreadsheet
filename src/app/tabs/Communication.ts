import {Identifier} from "../identifier/Identifier";

export interface Communication<T> {
  send(update: T): void;

  get isConnected(): boolean;

  set isConnected(enabled: boolean);

  get identifier(): Identifier;

  get countedBytes(): number;

  get countedMessages() : number;
}
