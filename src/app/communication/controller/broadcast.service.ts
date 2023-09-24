import {Injectable} from '@angular/core';
import {CommunicationObserver} from "./CommunicationObserver";
import {Message} from "../domain/Message";
import {Identifier} from "../../identifier/Identifier";
import {VectorClockManager} from "../util/VectorClockManager";
import {MessageBuffer} from "../util/MessageBuffer";
import {VectorClock} from "../domain/VectorClock";
import {Communication} from "../../test-environment/Communication";
import * as Y from "yjs";
import {ConsoleHook} from "../../ConsoleHook";


@Injectable({
  providedIn: 'root'
})
export class BroadcastService<T> implements Communication<T> {
  private readonly _identifier: Identifier = Identifier.generate();
  private channel: BroadcastChannel | undefined;
  private observer: CommunicationObserver<T> | undefined;
  private _nodes: Set<string> = new Set();
  private messageBuffer: MessageBuffer<T> = new MessageBuffer<T>();
  private versionVectorManager: VectorClockManager = new VectorClockManager();
  private _isConnected: boolean = true;
  private _totalReceivedMessages = 0;
  private _totalSentMessages = 0;
  private _totalBytes = 0;
  private _countBytes = true;
  private _delay = 0;
  private consoleHook: ConsoleHook = new ConsoleHook();

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
    this.versionVectorManager = new VectorClockManager();
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
    if (this.countBytes) {
      this.updateByteCounter(message);
    }
    message.timestamp = Date.now();
    this.channel.postMessage(message);
  }

  private onMessage = (event: MessageEvent): any => {
    const message = event.data as Message<any>;
    const delay = message.timestamp !== undefined ? Date.now() - message.timestamp : undefined;
    if (this.countBytes) {
      this.updateByteCounter(message);
    }
    this._totalReceivedMessages++;
    if (!this._isConnected) {
      return;
    }
    this.onNode(message.source);
    if (message.vectorClock !== undefined) {
      this.sendMissingMessages(message.source, message.vectorClock);
    }
    if (message.logicalTimestamp !== undefined) {
      this.versionVectorManager.update(message.source, message.logicalTimestamp);
    }
    if (message.destination === this._identifier.uuid && message.payload !== undefined) {
      setTimeout(() => {
        this.observer?.onMessage(message.payload, delay);
      })
    }
  }


  private updateByteCounter(message: Message<T>) {
    if (message.payload instanceof Uint8Array) {
      const payload = message.payload;
      message.payload = undefined;
      this._totalBytes += new Blob([JSON.stringify(message)]).size;
      message.payload = payload;
      const bytes = this.consoleHook.getUpdateSize(payload);
      this._totalBytes += bytes;
    } else {
      const bytes = new Blob([JSON.stringify(message)]).size;
      this._totalBytes += bytes;
    }
  }

  private sendMissingMessages(destination: string, versionVector: VectorClock) {
    const timestamp = versionVector[this._identifier.uuid];
    this.messageBuffer.getMissingMessages(destination, timestamp).forEach(message => this.postMessage(message));
  }

  public send(payload: T, destination?: string, atLeastOnce = true) {
    let message: Message<T> = {
      source: this._identifier.uuid,
      destination: destination,
      payload: payload
    };
    if (atLeastOnce) {
      message = this.messageBuffer.add(message);
    }
    if (this._isConnected) {
      if (destination === undefined) {
        this._nodes.forEach(dest => {
          setTimeout(() => {
            message.destination = dest;
            this.postMessage(message)
          }, this._delay);
        });
        return;
      }
      setTimeout(() => {
        this.postMessage(message);
      }, this._delay);
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
      vectorClock: this.versionVectorManager.vectorClock
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
