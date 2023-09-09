import {Injectable} from '@angular/core';
import {CommunicationObserver} from "./CommunicationObserver";
import {Message} from "../domain/Message";
import {Identifier} from "../../identifier/Identifier";
import {VersionVectorManager} from "../util/VersionVectorManager";
import {MessageBuffer} from "../util/MessageBuffer";
import {VersionVector} from "../domain/VersionVector";
import {Communication} from "../../test-environment/Communication";
import * as Y from "yjs";


@Injectable({
  providedIn: 'root'
})
export class BroadcastService<T> implements Communication<T> {
  private readonly _identifier: Identifier = Identifier.generate();
  private channel: BroadcastChannel | undefined;
  private observer: CommunicationObserver<T> | undefined;
  private _nodes: Set<string> = new Set();
  private messageBuffer: MessageBuffer<T> = new MessageBuffer<T>();
  private versionVectorManager: VersionVectorManager = new VersionVectorManager();
  private _isConnected: boolean = true;
  private _totalReceivedMessages = 0;
  private _totalSentMessages = 0;
  private _totalBytes = 0;
  private _countBytes = false;
  private _delay = 500;
  private delayStart = 0;

  public openChannel(channelName: string, observer: CommunicationObserver<T>) {
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
    this._totalReceivedMessages = 0;
    this._totalSentMessages = 0;
    this._totalBytes = 0;
  }

  private postMessage(message: Message<any>) {
    // console.log(`delay: ${this.delay} actual delay is:`, Date.now() - this.delayStart);
    if (this.channel === undefined || this.observer === undefined) {
      console.warn('Cant post message, channel is undefined');
      return;
    }
    // console.log('SEND: ',message.payload);
    this._totalSentMessages++;
    if (this.countBytes) {
      this.updateByteCounter(message);
    }
    this.channel.postMessage(message);
  }

  private onMessage = (event: MessageEvent): any => {
    if (this.countBytes) {
      this.updateByteCounter(event.data);
    }
    if (!this._isConnected) {
      return;
    }
    const message = event.data as Message<any>;
    this.onNode(message.source);
    if (message.versionVector !== undefined) {
      this.sendMissingMessages(message.source, message.versionVector);
    }
    if (message.timestamp !== undefined) {
      this.versionVectorManager.update(message.source, message.timestamp);
    }
    if (message.destination === this._identifier.uuid && message.payload !== undefined) {
      this._totalReceivedMessages++;
      // console.log('RECEIVED: ',message.payload);
      this.observer?.onMessage(message.payload);
    }
  }


  private updateByteCounter(message: Message<T>) {
    if (message.payload instanceof Uint8Array) {
      const payload = message.payload;
      message.payload = undefined;
      this._totalBytes += new Blob([JSON.stringify(message)]).size;
      message.payload = payload;
      const decoded = Y.decodeUpdate(payload);
      this._totalBytes += new Blob([JSON.stringify(decoded)]).size;
      // const size = this.consoleHook.getUpdateSize(payload);
      // this._totalBytes += size;
    } else {
      const bytes = new Blob([JSON.stringify(message)]).size;
      this._totalBytes += bytes;
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
          this.delayStart = Date.now();
          setTimeout(() => {
            message.destination = dest;
            this.postMessage(message)
          }, this._delay);
        });
        return;
      }
      this.delayStart = Date.now();
      setTimeout(() => {
        this.postMessage(message);
      }, this._delay);
      // this.postMessage(message);
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


  get countBytes(): boolean {
    return this._countBytes;
  }

  set countBytes(value: boolean) {
    this._countBytes = value;
  }


  get delay(): number {
    return this._delay;
  }

  set delay(value: number) {
    this._delay = value;
  }
}
