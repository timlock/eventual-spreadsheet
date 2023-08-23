import {Identifier} from "../identifier/Identifier";

export interface Communication<T> {
  get isConnected(): boolean;

  set isConnected(enabled: boolean);

  get identifier(): Identifier;

  send(update: T): void;
}
