import {Message} from "./Message";

export interface RemoteObserver<T> {
  onMessage(message: Message<T>): void;
  onNode(nodeId: string): void;
}
