import {Injectable} from '@angular/core';
import {CommunicationService} from "./communication.service";
import {NodeId, RaftMessage} from "../tab2/raft/domain/Types";
import {RemoteObserver} from "./RemoteObserver";
import {Message, Payload} from "./Message";
import {Timer} from "../tab2/raft/Timer";
import {RaftNode} from "../tab2/raft/RaftNode";
import {Identifier} from "../spreadsheet/util/Identifier";
import {RaftObserver} from "../tab2/raft/RaftObserver";
import {Log} from "../tab2/raft/domain/Log";
import {Remote} from "./Remote";


@Injectable({
  providedIn: 'root'
})
export class RaftService implements RaftObserver, RemoteObserver<RaftMessage>, Remote<Payload> {
  private readonly communicationService: CommunicationService<RaftMessage>;
  private _identifier: Identifier;
  private readonly timer: Timer;
  private readonly node: RaftNode;
  private observer: RemoteObserver<Payload> | undefined;
  private channelName: string = 'raft';

  constructor(communicationService: CommunicationService<RaftMessage>) {
    this.communicationService = communicationService;
    this._identifier = Identifier.generate();
    this.timer = new Timer();
    this.node = new RaftNode(this._identifier.uuid, this);
  }

  public openChannel(channelName: string, observer: RemoteObserver<Payload>, identifier?: Identifier) {
    this.channelName = channelName;
    this.observer = observer;
    if (identifier !== undefined) {
      this._identifier = identifier;
    }
    this.communicationService.openChannel(this.channelName, this, this._identifier);
  }

  public closeChannel() {
    this.timer.stop();
    this.communicationService.closeChannel();
  }

  public postMessage(message: Message<Payload>): boolean {
    this.node.command(message);
    return true;
  }

  public onLog(log: Log): void {
    console.log('Log applied: ', log);
    this.observer?.onMessage(log.content);
  }

  public sendMessage(destination: NodeId, raftMessage: RaftMessage): void {
    let message: Message<RaftMessage> = {
      sender: this._identifier.uuid,
      destination: destination,
      payload: raftMessage
    }
    this.communicationService.postMessage(message);
  }


  public onMessage(message: Message<RaftMessage>): void {
    if (message.payload !== undefined) {
      this.node.handleMessage(message.payload);
    }
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
    return this._identifier;
  }
}
