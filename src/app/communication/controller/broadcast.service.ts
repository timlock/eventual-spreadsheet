import {Injectable} from '@angular/core';
import {CommunicationServiceObserver} from "./CommunicationServiceObserver";
import {Message} from "../domain/Message";
import {Identifier} from "../../identifier/Identifier";
import {VersionVectorManager} from "../util/VersionVectorManager";
import {MessageBuffer} from "../util/MessageBuffer";
import {VersionVector} from "../domain/VersionVector";
import {Communication} from "../../tabs/Communication";

@Injectable({
  providedIn: 'root'
})
export class BroadcastService<T> implements Communication<T> {
  private readonly _identifier: Identifier = Identifier.generate();
  private channel: BroadcastChannel | undefined;
  private observer: CommunicationServiceObserver<T> | undefined;
  private _nodes: Set<string> = new Set();
  private messageBuffer: MessageBuffer<T> = new MessageBuffer<T>();
  private versionVectorManager: VersionVectorManager = new VersionVectorManager();
  private _isConnected: boolean = true;
  private _totalReceivedMessages = 0;
  private _totalSentMessages = 0;
  private _totalBytes = 0;
  private static readonly QUIT = 'QUIT';

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
      this.announceQuit();
      this.channel.close();
    }
    this.channel = undefined;
    this._nodes.clear();
    this.messageBuffer = new MessageBuffer<T>();
    this.versionVectorManager = new VersionVectorManager();
    this._totalReceivedMessages = 0;
    this._totalSentMessages = 0;
    this._totalBytes = 0;
  }

  private postMessage(message: Message<any>) {
    if (this.channel === undefined || this.observer === undefined) {
      console.warn('Cant post message, channel is undefined');
      return;
    }
    this._totalSentMessages++;
    this._totalBytes += new Blob([JSON.stringify(message)]).size;
    this.channel.postMessage(message);
  }

  private onMessage = (event: MessageEvent): any => {
    const bytes = new Blob([JSON.stringify(event.data)]).size;
    this._totalBytes += bytes;
    if (!this._isConnected) {
      return;
    }
    const message = event.data as Message<T>;
    if (message.payload === BroadcastService.QUIT) {
      this._nodes.delete(message.source);
      return;
    }
    this.onNode(message.source);
    if (message.versionVector !== undefined) {
      this.sendMissingMessages(message.source, message.versionVector);
    }
    if (message.timestamp !== undefined) {
      this.versionVectorManager.update(message.source, message.timestamp);
    }
    if (message.destination === this._identifier.uuid && message.payload !== undefined) {
      this._totalReceivedMessages++;
      this.observer?.onMessage(message.payload);
    }
  }

  private sendMissingMessages(destination: string, versionVector: VersionVector) {
    const timestamp = versionVector[this._identifier.uuid];
    this.messageBuffer.getMissingMessages(destination, timestamp).forEach(message => this.postMessage(message));
  }

  public send(payload: T, destination?: string, atLeastOnce = true) {
    let message: Message<T> = {source: this._identifier.uuid, destination: destination, payload: payload};
    if (atLeastOnce) {
      message = this.messageBuffer.add(message);
    }
    if (this._isConnected) {
      if (destination === undefined) {
        this._nodes.forEach(dest => {
          message.destination = dest;
          this.postMessage(message);
        });
        return;
      }
      this.postMessage(message);
    }
  }

  public onNode(nodeId: string) {
    const oldSize = this._nodes.size;
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
    const message: Message<undefined> = {
      source: this._identifier.uuid,
      versionVector: this.versionVectorManager.versionVector
    }
    this.postMessage(message);
  }

  private announceQuit() {
    const message: Message<string> = {
      source: this._identifier.uuid,
      payload: BroadcastService.QUIT
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

  get totalBytes(): number {
    return this._totalBytes;
  }

  get countedMessages(): number {
    return this._totalReceivedMessages + this._totalSentMessages;
  }

  get totalReceivedMessages(): number {
    return this._totalReceivedMessages;
  }

  get totalSentMessages(): number {
    return this._totalSentMessages;
  }
}
