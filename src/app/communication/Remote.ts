import {RemoteObserver} from "./RemoteObserver";
import {Message} from "./Message";

export interface Remote<T> {
  openChannel(channelName: string, observer: RemoteObserver<T>): void;

  closeChannel(): void;

  postMessage(message: Message<T>): boolean;

  get nodes(): Set<string>;
}
