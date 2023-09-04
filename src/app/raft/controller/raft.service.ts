import {Injectable} from '@angular/core';
import {BroadcastService} from "../../communication/controller/broadcast.service";
import {NodeId, RaftMessage} from "../domain/Types";
import {CommunicationObserver} from "../../communication/controller/CommunicationObserver";
import {Timer} from "../util/Timer";
import {RaftNode} from "./RaftNode";
import {Identifier} from "../../identifier/Identifier";
import {RaftNodeObserver} from "./RaftNodeObserver";
import {Log} from "../domain/message/Log";
import {RaftServiceObserver} from "../util/RaftServiceObserver";
import {RaftMetaData} from "../util/RaftMetaData";
import {Communication} from "../../tabs/Communication";

@Injectable({
  providedIn: 'root'
})
export class RaftService<T> implements RaftNodeObserver<T>, CommunicationObserver<RaftMessage<T>>, Communication<T> {
  private readonly timer: Timer;
  private readonly node: RaftNode<T>;
  private observer: RaftServiceObserver<T> | undefined;
  private channelName: string = 'raft';
  private _isConnected: boolean = true;

  constructor(private readonly communicationService: BroadcastService<RaftMessage<T>>) {
    this.timer = new Timer();
    this.node = new RaftNode(this.identifier.uuid, this);
  }

  public openChannel(channelName: string, observer: RaftServiceObserver<T>) {
    this.closeChannel();
    this.channelName = channelName;
    this.observer = observer;
    this.communicationService.openChannel(this.channelName, this);
  }

  public closeChannel() {
    this.timer.stop();
    this.communicationService.closeChannel();
  }

  public start() {
    this.node.start();
  }

  public send(message: T) {
    this.node.command(message);
  }

  public sendLog(destination: NodeId, log: Log<T>) {
    if(this._isConnected){
      this.communicationService.send(log, destination, true);
    }
  }

  public onLog(log: Log<T>): void {
    this.observer?.onMessage(log.content);
    return;
  }

  public sendRaftMessage(destination: NodeId, raftMessage: RaftMessage<T>): void {
    if (this._isConnected) {
      this.communicationService.send(raftMessage, destination, false);
    }
  }

  public onMessage(message: RaftMessage<T>): void {
    if (this._isConnected) {
      this.node.handleMessage(message);
    }
  }

  public onNode(nodeId: string) {
    const result = this.node.addNode(nodeId);
    if (result) {
      console.log('Added node: ', nodeId, ' to cluster');
      this.observer?.onNode(nodeId);
    }
  }

  private checkTime() {
    const remaining = this.timer.remainingTime();
    if (this.timer.isTimeUp()) {
      this.node.timeout();
    } else if (remaining !== undefined) {
      setTimeout(() => this.checkTime(), remaining);
    }
  }

  public restartElectionTimer(): void {
    this.timer.randomDuration();
    const remaining = this.timer.remainingTime();
    if (remaining !== undefined) {
      setTimeout(() => this.checkTime(), remaining);
    }
  }

  public restartHeartbeatTimer(): void {
    this.timer.fixedDuration();
    const remaining = this.timer.remainingTime();
    if (remaining !== undefined) {
      setTimeout(() => this.checkTime(), remaining);
    }
  }

  public canBeStarted(): boolean {
    return this.isConnected && !this.isActive() && this.nodes.size > 1;
  }

  get nodes(): Set<string> {
    return this.node.cluster;
  }

  get identifier(): Identifier {
    return this.communicationService.identifier;
  }

  set isConnected(value: boolean) {
    this._isConnected = value;
  }

  get isConnected(): boolean {
    return this._isConnected;
  }

  public onStateChange(state: RaftMetaData): void {
    this.observer?.onStateChange(state);
  }

  public getMetaData(): RaftMetaData {
    return this.node.getMetaData();
  }

  public isActive(): boolean {
    return this.timer.isActive();
  }

  get totalBytes(): number {
    return this.communicationService.totalBytes;
  }

  get countedMessages(): number {
    return this.communicationService.countedMessages;
  }

  get totalReceivedMessages(): number {
    return this.communicationService.totalReceivedMessages;
  }

  get totalSentMessages(): number {
    return this.communicationService.totalSentMessages;
  }

}
