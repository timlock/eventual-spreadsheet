import {Injectable} from '@angular/core';
import {CommunicationServiceObserver} from "./CommunicationServiceObserver";
import {Message} from "../domain/Message";
import {Identifier} from "../../identifier/Identifier";
import {VersionVectorManager} from "../util/VersionVectorManager";
import {MessageBuffer} from "../util/MessageBuffer";
import {VersionVector} from "../domain/VersionVector";

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
  private _isConnected: boolean = true;

  public openChannel(channelName: string, observer: CommunicationServiceObserver<T>) {
    if (this.channel !== undefined) {
      this.closeChannel();
    }
    this.observer = observer;
    this.channel = new BroadcastChannel(channelName);
    this.channel.onmessage = this.onMessage;
    this.advertiseSelf();
  }

  public closeChannel() {
    if (this.channel !== undefined) {
      this.channel.close();
    }
    this.channel = undefined;
    this._nodes.clear();
    this.messageBuffer = new MessageBuffer<T>();
    this.versionVectorManager = new VersionVectorManager();
  }


  private postMessage(message: Message<any>) {
    if (this.channel === undefined || this.observer === undefined) {
      console.warn('Cant post message, channel is undefined');
      return;
    }
    this.channel.postMessage(message);
  }

  private onMessage = (event: MessageEvent): any => {
    if (!this._isConnected) {
      return;
    }
    let message = event.data as Message<T>;
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

  public send(payload: T, destination?: string): boolean {
    let message: Message<T> = {source: this._identifier.uuid, destination: destination, payload: payload};
    message = this.messageBuffer.add(message);
    if (destination === undefined) {
      this._nodes.forEach(dest => {
        message.destination = dest;
        if (this._isConnected) {
          this.postMessage(message);
        }
      });
      return true;
    }
    if (this._isConnected) {
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
      this.messageBuffer.addNode(nodeId);
      this.advertiseSelf();
    }
  }

  private advertiseSelf() {
    let message: Message<undefined> = {
      source: this._identifier.uuid,
      versionVector: this.versionVectorManager.versionVector
    }
    this.postMessage(message);
  }

  set isConnected(value: boolean) {
    this._isConnected = value;
    if (this._isConnected) {
      this.messageBuffer.getUnsentMessages().forEach(message => this.postMessage(message));
      this.advertiseSelf();
    }
  }

  get isConnected(): boolean {
    return this._isConnected;
  }

  get nodes(): Set<string> {
    return this._nodes;
  }

  get identifier(): Identifier {
    return this._identifier;
  }


}
