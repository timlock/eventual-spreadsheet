import {Injectable} from '@angular/core';
import {CommunicationService} from "./communication.service";
import {NodeId, RaftMessage} from "../raft/domain/Types";
import {RemoteObserver} from "./RemoteObserver";
import {Timer} from "../raft/Timer";
import {RaftNode} from "../raft/RaftNode";
import {Identifier} from "../Identifier";
import {RaftNodeObserver} from "../raft/RaftNodeObserver";
import {Log} from "../raft/domain/Log";
import {isPayload, Payload} from "../spreadsheet/util/Payload";
import {RaftServiceObserver} from "./RaftServiceObserver";


@Injectable({
  providedIn: 'root'
})
export class RaftService implements RaftNodeObserver, RemoteObserver<RaftMessage> {
  private readonly communicationService: CommunicationService<RaftMessage>;
  private readonly timer: Timer;
  private readonly node: RaftNode;
  private observer: RaftServiceObserver<Payload> | undefined;
  private channelName: string = 'raft';

  constructor(communicationService: CommunicationService<RaftMessage>) {
    this.communicationService = communicationService;
    this.timer = new Timer();
    this.node = new RaftNode(this.identifier.uuid, this);
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

  public postMessage(message: Payload): boolean {
    this.node.command(message);
    return true;
  }

  public onLog(log: Log): void {
    if(isPayload(log.content)){
      this.observer?.onMessage(log.content);
      console.log('Log applied: ', log);
      return;
    }
    console.warn('Log doesnt contain payload, ', log);
  }

  public sendMessage(destination: NodeId, raftMessage: RaftMessage): void {
    this.communicationService.send(raftMessage, destination);
  }


  public onMessage(message: RaftMessage, source: string): void {
    this.node.handleMessage(message);
  }


  public onNode(nodeId: string) {
    let result = this.node.addNode(nodeId);
    if (result) {
      console.log('Added node: ', nodeId, ' to cluster');
      if (this.node.clusterSize > 3) {
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
      let self = this;
      setTimeout(() => self.checkTime(), remaining);
    }
  }

  public restartElectionTimer(): void {
    this.timer.randomDuration();
    if (this.timer === undefined) {
      console.log('Found');
    }
    let remaining = this.timer.remainingTime();
    if (remaining !== undefined) {
      let self = this;
      setTimeout(() => self.checkTime(), remaining);
    }
  }


  public restartHeartbeatTimer(): void {
    this.timer.fixedDuration();
    let remaining = this.timer.remainingTime();
    if (remaining !== undefined) {
      let self = this;
      setTimeout(() => self.checkTime(), remaining);
    }
  }

  get nodes(): Set<string> {
    return this.node.cluster;
  }

  get identifier(): Identifier {
    return this.communicationService.identifier;
  }
}
