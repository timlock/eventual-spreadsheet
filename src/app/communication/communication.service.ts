import {Injectable} from '@angular/core';
import {RemoteObserver} from "./RemoteObserver";
import {Message} from "./Message";
import {Remote} from "./Remote";
import {Identifier} from "../spreadsheet/util/Identifier";

@Injectable({
  providedIn: 'root'
})
export class CommunicationService<T> {
  private readonly _identifier: Identifier = Identifier.generate();
  private channel: BroadcastChannel | undefined;
  private observer: RemoteObserver<T> | undefined;
  private _nodes: Set<string> = new Set<string>();

  constructor() {
    this._identifier = Identifier.generate();
  }

  public openChannel(channelName: string, observer: RemoteObserver<T>, identifier?: Identifier) {
    if (this.channel !== undefined) {
      this.channel.close();
    }
    this.observer = observer;
    if (identifier !== undefined) {
      this._identifier = identifier;
    }
    this.channel = new BroadcastChannel(channelName);
    this.channel.onmessage = event => {
      let message = event.data as Message<T>;
      this.onNode(message.sender);
      if (message.payload !== undefined && (message.destination === undefined || message.destination === this.identifier?.uuid)) {
        this.observer?.onMessage(message);
      }
    }
    this.advertiseSelf();
  }

  public closeChannel() {
    if (this.channel !== undefined) {
      this.channel.close();
    }
    this.channel = undefined;
  }

  public postMessage(payload: T, destination: string): boolean {
    if (this.channel === undefined || this.observer === undefined) {
      console.warn('Cant post message, channel is undefined');
      return false;
    }
    let message: Message<T> = {sender: this._identifier.uuid, destination: destination, payload: payload};

    this.channel.postMessage(message);
    return true;
  }

  public onNode(nodeId: string) {
    let oldSize = this._nodes.size;
    this._nodes.add(nodeId);
    if (this._nodes.size > oldSize) {
      if (this.observer === undefined) {
        console.warn('Observer is undefined');
        return;
      }
      this.observer.onNode(nodeId);
      this.advertiseSelf();
    }
  }

  private advertiseSelf() {
    let message: Message<any> = {
      sender: this._identifier.uuid
    }
    this.postMessage(message);
  }

  get nodes(): Set<string> {
    return this._nodes;
  }


  get identifier(): Identifier {
    return this._identifier;
  }

}
