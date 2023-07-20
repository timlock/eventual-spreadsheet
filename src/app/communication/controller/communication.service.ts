import {Injectable} from '@angular/core';
import {CommunicationServiceObserver} from "./CommunicationServiceObserver";
import {Message} from "../Message";
import {Identifier} from "../../Identifier";
import {VersionVectorManager} from "../util/VersionVectorManager";
import {MessageBuffer} from "../util/MessageBuffer";
import {VersionVector} from "../VersionVector";

@Injectable({
  providedIn: 'root'
})
export class CommunicationService<T> {
  private readonly _identifier: Identifier = Identifier.generate();
  private channel: BroadcastChannel | undefined;
  private observer: CommunicationServiceObserver<T> | undefined;
  private _nodes: Set<string> = new Set<string>();
  private messageBuffer: MessageBuffer<T> = new MessageBuffer<T>();
  private versionVectorManager: VersionVectorManager = new VersionVectorManager();
  private _connected: boolean = true;

  private postMessage(message: Message<any>) {
    // console.log('SEND MESSAGE ', message);
    this.channel?.postMessage(message);
  }

  private onMessage = (event: MessageEvent<any>): any => {
    if (!this._connected) {
      return;
    }
    let message = event.data as Message<T>;
    // console.log('RECEIVE MESSAGE ', message);
    this.onNode(message.source);
    if (message.versionVector !== undefined) {
      this.sendMissingMessages(message.source, message.versionVector);
    }
    if (message.timestamp !== undefined) {
      this.versionVectorManager.update(message.source, message.timestamp);
    }
    if (message.destination === this._identifier.uuid && message.payload !== undefined) {
      this.observer?.onMessage(message.payload, message.source);
    }
  }

  private sendMissingMessages(destination: string, versionVector: VersionVector) {
    let timestamp = versionVector[this._identifier.uuid];
    this.messageBuffer.getMissingMessages(destination, timestamp).forEach(message => this.postMessage(message));
  }

  public openChannel(channelName: string, observer: CommunicationServiceObserver<T>) {
    if (this.channel !== undefined) {
      this.channel.close();
    }
    this.observer = observer;
    this.channel = new BroadcastChannel(channelName);
    this.channel.onmessage = this.onMessage
    this.advertiseSelf();
  }

  public closeChannel() {
    if (this.channel !== undefined) {
      this.channel.close();
    }
    this.channel = undefined;
  }


  public send(payload: T, destination?: string): boolean {
    if (this.channel === undefined || this.observer === undefined) {
      console.warn('Cant post message, channel is undefined');
      return false;
    }
    let message: Message<T> = {source: this._identifier.uuid, destination: destination, payload: payload};
    if(destination === undefined){
      this._nodes.forEach(dest => {
        message.destination = dest;
        message = this.messageBuffer.add(message, this._connected)!;
        if (this._connected) {
          this.postMessage(message);
        }
      });
      return true;
    }
    message = this.messageBuffer.add(message, this._connected)!;
    if (this._connected) {
      this.postMessage(message);
    }
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
    let message: Message<undefined> = {
      source: this._identifier.uuid,
      versionVector: this.versionVectorManager.versionVector
    }
    if (this.channel === undefined) {
      console.warn('Channel is undefined');
      return;
    }
    this.postMessage(message);
  }

  get nodes(): Set<string> {
    return this._nodes;
  }


  get identifier(): Identifier {
    return this._identifier;
  }


  get connected(): boolean {
    return this._connected;
  }

  set connected(value: boolean) {
    this._connected = value;
    if (this._connected) {
      this.advertiseSelf();
      this.messageBuffer.getUnsentMessages().forEach(message => this.postMessage(message));
    }
  }
}
