import {Injectable} from '@angular/core';
import {BroadcastService} from "../communication/controller/broadcast.service";
import {NodeId, RaftMessage} from "../raft/domain/Types";
import {CommunicationObserver} from "../communication/controller/CommunicationObserver";
import {Timer} from "../raft/util/Timer";
import {RaftNode} from "../raft/controller/RaftNode";
import {Identifier} from "../identifier/Identifier";
import {RaftNodeObserver} from "../raft/controller/RaftNodeObserver";
import {Log} from "../raft/domain/message/Log";
import {RaftServiceObserver} from "../raft/util/RaftServiceObserver";
import {RaftMetaData} from "../raft/util/RaftMetaData";
import {Communication} from "../test-environment/Communication";

@Injectable({
  providedIn: 'root'
})
export class RaftService<T> implements RaftNodeObserver<T>, CommunicationObserver<RaftMessage<T>>, Communication<T> {
  private readonly timer: Timer;
  private readonly node: RaftNode<T>;
  private observer: RaftServiceObserver<T> | undefined;
  private channelName: string = 'raft';
  private _isConnected: boolean = true;
  private messageDelays: number[] = [];
  private lastMedianDelay: number | undefined;

  constructor(private readonly broadcastService: BroadcastService<RaftMessage<T>>) {
    this.timer = new Timer();
    this.node = new RaftNode(this.identifier.uuid, this);
  }

  public openChannel(channelName: string, observer: RaftServiceObserver<T>) {
    this.closeChannel();
    this.channelName = channelName;
    this.observer = observer;
    this.broadcastService.openChannel(this.channelName, this);
  }

  public closeChannel() {
    this.timer.stop();
    this.broadcastService.closeChannel();
  }

  public start() {
    this.node.start();
  }

  public send(message: T) {
    // console.log('\n\n\nCOMMAND: ', message,'\n\n');
    this.node.command(message);
  }

  public sendLog(destination: NodeId, log: Log<T>) {
    if (this._isConnected) {
      this.broadcastService.send(log, destination, true);
    }
  }

  public onLog(log: Log<T>): void {
    const median = this.calculateMedianMessageDelay();
    this.observer?.onMessage(log.content, median);
    return;
  }

  private calculateMedianMessageDelay(): number | undefined {
    if (this.messageDelays.length === 0) {
      return this.lastMedianDelay;
    }
    this.messageDelays.sort((a, b) => a - b);
    // const median = this.messageDelays[Math.floor(this.messageDelays.length / 2)];
    const median = this.messageDelays[this.messageDelays.length - Math.floor(((this.messageDelays.length / 10) + 1))];
    // const median = this.messageDelays[this.messageDelays.length - 1];
    // console.log('Median: ', median);
    this.messageDelays = [];
    this.lastMedianDelay = median;
    return median;
  }

  public sendRaftMessage(destination: NodeId, raftMessage: RaftMessage<T>): void {
    if (this._isConnected) {
      this.broadcastService.send(raftMessage, destination, false);
    }
  }

  public onMessage(message: RaftMessage<T>, delay?: number): void {
    if (delay !== undefined) {
      this.messageDelays.push(delay);
    }
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
    return this.broadcastService.identifier;
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
    return this.broadcastService.totalBytes;
  }

  get countedMessages(): number {
    return this.broadcastService.countedMessages;
  }

  get totalReceivedMessages(): number {
    return this.broadcastService.totalReceivedMessages;
  }

  get totalSentMessages(): number {
    return this.broadcastService.totalSentMessages;
  }

  get countBytes(): boolean {
    return this.broadcastService.countBytes;
  }

  set countBytes(value: boolean) {
    this.broadcastService.countBytes = value;
  }

  get delay(): number {
    return this.broadcastService.delay;
  }

  set delay(value: number) {
    this.broadcastService.delay = value;
  }

}
