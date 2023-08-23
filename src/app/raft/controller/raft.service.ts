import {Injectable} from '@angular/core';
import {BroadcastService} from "../../communication/controller/broadcast.service";
import {NodeId, RaftMessage} from "../domain/Types";
import {CommunicationServiceObserver} from "../../communication/controller/CommunicationServiceObserver";
import {Timer} from "../util/Timer";
import {RaftNode} from "./RaftNode";
import {Identifier} from "../../identifier/Identifier";
import {RaftNodeObserver} from "./RaftNodeObserver";
import {Log} from "../domain/message/Log";
import {isPayload, Action} from "../../spreadsheet/util/Action";
import {RaftServiceObserver} from "../util/RaftServiceObserver";
import {RaftMetaData} from "../util/RaftMetaData";
import {Communication} from "../../tabs/Communication";


@Injectable({
  providedIn: 'root'
})
export class RaftService implements RaftNodeObserver, CommunicationServiceObserver<RaftMessage>, Communication<Action> {
  private readonly timer: Timer;
  private readonly node: RaftNode;
  private observer: RaftServiceObserver<Action> | undefined;
  private channelName: string = 'raft';
  private _isConnected: boolean = true;

  constructor(private readonly communicationService: BroadcastService<RaftMessage>) {
    this.timer = new Timer();
    this.node = new RaftNode(this.identifier.uuid, this, false);
  }

  public openChannel(channelName: string, observer: RaftServiceObserver<Action>) {
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

  public send(message: Action) {
    this.node.command(message);
  }

  public onLog(log: Log): void {
    if (isPayload(log.content)) {
      this.observer?.onMessage(log.content);
      console.log('Log applied: ', log);
      return;
    }
    console.warn('Log doesnt contain payload, ', log);
  }

  public sendRaftMessage(destination: NodeId, raftMessage: RaftMessage): void {
    if (this._isConnected) {
      this.communicationService.send(raftMessage, destination, false);
    }
  }


  public onMessage(message: RaftMessage): void {
    if (this._isConnected) {
      this.node.handleMessage(message);
    }
  }


  public onNode(nodeId: string) {
    let result = this.node.addNode(nodeId);
    if (result) {
      console.log('Added node: ', nodeId, ' to cluster');
      this.observer?.onNode(nodeId);
    }
  }

  private checkTime() {
    let remaining = this.timer.remainingTime();
    if (this.timer.isTimeUp()) {
      this.node.timeout();
    } else if (remaining !== undefined) {
      setTimeout(() => this.checkTime(), remaining);
    }
  }

  public restartElectionTimer(): void {
    this.timer.randomDuration();
    let remaining = this.timer.remainingTime();
    if (remaining !== undefined) {
      setTimeout(() => this.checkTime(), remaining);
    }
  }


  public restartHeartbeatTimer(): void {
    this.timer.fixedDuration();
    let remaining = this.timer.remainingTime();
    if (remaining !== undefined) {
      setTimeout(() => this.checkTime(), remaining);
    }
  }

  public canBeStarted(): boolean{
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

  public onMessageCounterUpdate(received: number, total: number) {
    this.observer?.onMessageCounterUpdate(received, total);
  }

}
