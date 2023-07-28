import {Injectable} from '@angular/core';
import {CommunicationService} from "../communication/controller/communication.service";
import {NodeId, RaftMessage} from "./domain/Types";
import {CommunicationServiceObserver} from "../communication/controller/CommunicationServiceObserver";
import {Timer} from "./Timer";
import {RaftNode} from "./RaftNode";
import {Identifier} from "../Identifier";
import {RaftNodeObserver} from "./RaftNodeObserver";
import {Log} from "./domain/message/Log";
import {isPayload, Payload} from "../spreadsheet/util/Payload";
import {RaftServiceObserver} from "../communication/controller/RaftServiceObserver";
import {RaftMetaData} from "./RaftMetaData";


@Injectable({
  providedIn: 'root'
})
export class RaftService implements RaftNodeObserver, CommunicationServiceObserver<RaftMessage> {
  private readonly communicationService: CommunicationService<RaftMessage>;
  private readonly timer: Timer;
  private readonly node: RaftNode;
  private observer: RaftServiceObserver<Payload> | undefined;
  private channelName: string = 'raft';
  private _isConnected: boolean = true;

  constructor(communicationService: CommunicationService<RaftMessage>) {
    this.communicationService = communicationService;
    this.timer = new Timer();
    this.node = new RaftNode(this.identifier.uuid, this, true);
  }

  public openChannel(channelName: string, observer: RaftServiceObserver<Payload>) {
    this.channelName = channelName;
    this.observer = observer;
    this.communicationService.openChannel(this.channelName, this);
  }

  public closeChannel() {
    this.timer.stop();
    this.communicationService.closeChannel();
  }

  public performAction(message: Payload): boolean {
    this.node.command(message);
    return true;
  }

  public onLog(log: Log): void {
    if (isPayload(log.content)) {
      this.observer?.onMessage(log.content);
      console.log('Log applied: ', log);
      return;
    }
    console.warn('Log doesnt contain payload, ', log);
  }

  public sendMessage(destination: NodeId, raftMessage: RaftMessage): void {
    if (this._isConnected) {
      this.communicationService.send(raftMessage, destination);
    }
  }


  public onMessage(message: RaftMessage, source: string): void {
    if (this._isConnected) {
      this.node.handleMessage(message);
    }
  }


  public onNode(nodeId: string) {
    let result = this.node.addNode(nodeId);
    if (result) {
      console.log('Added node: ', nodeId, ' to cluster');
      if (this.node.clusterSize > 2) {
        this.node.start();
      }
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

  public onLogsCorrected(log: Log[]): void {
    let operations = log.map(l => l.content);
    this.observer?.onLogsCorrected(operations);
  }
}