import {LogIndex, NodeId, RaftMessage, Term} from "../domain/Types";
import {
  isRequestVoteRequest,
  isRequestVoteResponse,
  RequestVoteRequest,
  RequestVoteResponse
} from "../domain/message/RequestVoteRequest";
import {
  AppendEntriesRequest,
  AppendEntriesResponse,
  isAppendEntriesRequest,
  isAppendEntriesResponse
} from "../domain/message/AppendEntriesRequest";
import {Leader} from "../domain/state/Leader";
import {Candidate} from "../domain/state/Candidate";
import {Follower} from "../domain/state/Follower";
import {ServerState} from "../domain/state/ServerState";
import {isLog, Log} from "../domain/message/Log";
import {RaftNodeObserver} from "./RaftNodeObserver";
import {RaftMetaData} from "../util/RaftMetaData";


export class RaftNode {
  private role: Leader | Candidate | Follower = new Follower();
  private serverState: ServerState;
  private _cluster: Set<NodeId> = new Set();
  private commandBuffer: any[] = [];


  constructor(
    private readonly _nodeId: NodeId,
    private readonly observer: RaftNodeObserver,
    private debug = false, logs: Log[] = []
  ) {
    this.serverState = new ServerState(logs);
  }

  public start() {
    this.observer.restartElectionTimer();
  }

  public handleMessage(message: RaftMessage) {
    if (message !== undefined) {
      if (isRequestVoteRequest(message)) {
        this.handleRequestVoteRequest(message)
      } else if (isRequestVoteResponse(message)) {
        this.handleRequestVoteResponse(message);
      } else if (isAppendEntriesRequest(message)) {
        this.handleAppendEntriesRequest(message);
      } else if (isAppendEntriesResponse(message)) {
        this.handleAppendEntriesResponse(message);
      } else if (isLog(message)) {
        this.handleCommand(message);
      } else {
        this.warn('invalid message: ', message);
      }
    }
  }

  private handleRequestVoteRequest(request: RequestVoteRequest) {
    this.print('Handle RequestVoteRequest: ', request);
    if (request.term > this.serverState.currentTerm) {
      this.becomeFollower(request.term);
    }
    let voteGranted = false;
    if (request.term === this.serverState.currentTerm
      && (this.serverState.votedFor === undefined || this.serverState.votedFor === request.candidateId)
      && this.serverState.isUpToDate(request.lastLogIndex, request.lastLogTerm)
    ) {
      this.serverState.votedFor = request.candidateId;
      voteGranted = true;
      this.observer.restartElectionTimer();
    }
    this.requestVoteResponse(request.candidateId, voteGranted);
  }

  private handleRequestVoteResponse(response: RequestVoteResponse) {
    this.print('Handle RequestVoteResponse: ', response);
    if (response.term > this.serverState.currentTerm) {
      this.becomeFollower(response.term);
    }
    if (this.role instanceof Candidate && response.voteGranted && response.term === this.serverState.currentTerm) {
      this.role.addVote(response.id);
      if (this.role.countVotes() >= this.majority()) {
        this.becomeLeader();
      }
    }
  }


  private handleAppendEntriesRequest(request: AppendEntriesRequest) {
    this.print('Handle AppendEntriesRequest: ', request);
    if (request.term > this.serverState.currentTerm || (this.role instanceof Candidate && this.serverState.currentTerm === request.term)) {
      this.becomeFollower(request.term, request.leaderId);
    }
    if (this.role instanceof Follower) {
      this.role.leaderId = request.leaderId;
    }
    this.observer.restartElectionTimer();
    if (request.term < this.serverState.currentTerm
      || !this.serverState.hasLogAtIndex(request.prevLogIndex)
      || request.prevLogTerm !== this.serverState.getLogTerm(request.prevLogIndex)) {
      this.appendEntriesResponse(request.leaderId, false);
      return;
    }
    // let newIndex = request.prevLogIndex;
    // for (const log of request.entries) {
    //   newIndex++;
    //   let oldEntry = this.serverState.log[newIndex - 1];
    //   if (oldEntry === undefined) {
    //     this.serverState.log.push(log);
    //   } else {
    //     if (oldEntry.term != log.term) {
    //       this.serverState.log.splice(newIndex - 1);
    //       this.serverState.log.push(log);
    //     }
    //   }
    // }
    // this.serverState.log.splice(request.prevLogIndex -1);
    let removedLogs = this.serverState.replaceInvalidLogs(request.prevLogIndex);
    if (removedLogs) {
      this.print('Removed invalid logs after index ', request.prevLogIndex);
    }
    this.serverState.logs.push(...request.entries)
    if (request.leaderCommit > this.serverState.commitIndex) {
      this.serverState.commitIndex = Math.min(request.leaderCommit, this.serverState.logs.length);
      this.serverState.fetchCommittedLogs().forEach(log => this.observer.onLog(log));
      this.print('Leader increased commitIndex to: ', this.serverState.commitIndex);
      this.observer.onStateChange(this.getMetaData());
    }
    this.appendEntriesResponse(request.leaderId, true);
    this.sendUnsentCommands();
  }


  private handleAppendEntriesResponse(response: AppendEntriesResponse) {
    this.print('Handle AppendEntriesResponse: ', response);
    if (response.term > this.serverState.currentTerm) {
      this.becomeFollower(response.term, response.id);
    }
    if (this.role instanceof Leader) {
      if (response.success) {
        if (response.lastLogIndex > this.role.matchIndex.get(response.id)!) {
          this.role.nextIndex.set(response.id, response.lastLogIndex + 1);
          this.role.matchIndex.set(response.id, response.lastLogIndex);
          this.advanceCommitIndex();
        }
      } else {
        this.role.decrementNexIndex(response.id);
        let prevLogIndex = this.role.nextIndex.get(response.id);
        if (prevLogIndex === undefined) {
          this.warn('Missing entry in nextIndex for: ', response.id);
          return;
        }
        let prevLogTerm = this.serverState.getLogTerm(prevLogIndex)!;
        let logs = this.serverState.logs.slice(prevLogIndex);
        this.appendEntriesRequest(response.id, prevLogIndex, prevLogTerm, logs);
        return;
      }
    } else {
      this.warn('handleAppendEntriesResponse: node is not leader ', response);
    }
  }

  public command(command: any) {
    if (this.role instanceof Follower && this.role.leaderId !== undefined) {
      this.log(this.role.leaderId, command)
    } else if (this.role instanceof Leader) {
      let log: Log = {term: this.serverState.currentTerm, content: command};
      this.handleCommand(log);
    } else {
      this.commandBuffer.push(command);
    }
  }

  private handleCommand(log: Log) {
    if (this.role instanceof Leader) {
      this.print('Received command: ', log);
      let prevLogIndex = this.serverState.lastLogIndex;
      let prevLogTerm = this.serverState.lastLogTerm;
      this.serverState.logs.push(log);
      this._cluster.forEach(id => this.appendEntriesRequest(id, prevLogIndex, prevLogTerm, [log]));
    } else {
      this.warn('Cant handle command as: ', this.role)
    }
  }

  private requestVoteRequest(destination: NodeId) {
    let message: RequestVoteRequest = {
      term: this.serverState.currentTerm,
      candidateId: this._nodeId,
      lastLogIndex: this.serverState.lastLogIndex,
      lastLogTerm: this.serverState.getLogTerm(this.serverState.lastLogIndex)!
    }
    this.observer.sendRaftMessage(destination, message);
    this.print('Send requestVoteRequest: ', message);
  }

  private requestVoteResponse(destination: NodeId, voteGranted: boolean) {
    let message: RequestVoteResponse = {
      term: this.serverState.currentTerm,
      voteGranted: voteGranted,
      id: this.nodeId
    }
    this.observer.sendRaftMessage(destination, message);
    this.print('Send requestVoteResponse: ', message);
  }

  private appendEntriesRequest(destination: NodeId, prevLogIndex: LogIndex, prevLogTerm: Term | undefined, entries: Log[] = []) {
    let message: AppendEntriesRequest = {
      term: this.serverState.currentTerm,
      leaderId: this._nodeId,
      prevLogIndex: prevLogIndex,
      prevLogTerm: prevLogTerm,
      entries: entries,
      leaderCommit: this.serverState.commitIndex
    };
    this.observer.sendRaftMessage(destination, message);
    this.print('Send appendEntriesRequest: ', message);
  }


  private appendEntriesResponse(destination: NodeId, success: boolean) {
    let message: AppendEntriesResponse = {
      term: this.serverState.currentTerm,
      success: success,
      id: this.nodeId,
      lastLogIndex: this.serverState.lastLogIndex
    }
    this.observer.sendRaftMessage(destination, message);
    this.print('Send appendEntriesResponse: ', message);
  }

  private log(destination: NodeId, command: any) {
    let message: Log = {term: this.serverState.currentTerm, content: command};
    this.observer.sendRaftMessage(destination, message);
    this.print('Send command: ', message);
  }

  private sendUnsentCommands() {
    this.commandBuffer.forEach(command => this.command(command));
    this.commandBuffer = [];
  }

  private becomeFollower(term?: Term, leaderId?: NodeId) {
    this.print('New role: FOLLOWER, term: ', term, ' leader: ', leaderId);
    if (term !== undefined) {
      this.serverState.currentTerm = term;
    }
    this.serverState.votedFor = undefined;
    this.role = new Follower(leaderId);
    this.observer.restartElectionTimer();
    this.observer.onStateChange(this.getMetaData());
  }

  private becomeCandidate() {
    this.print('New role: CANDIDATE');
    this.role = new Candidate();
    this.serverState.currentTerm++;
    this.serverState.votedFor = this._nodeId;
    this.role.addVote(this._nodeId);
    this.observer.restartElectionTimer();
    this._cluster.forEach(id => this.requestVoteRequest(id));
    this.observer.onStateChange(this.getMetaData());
  }

  private becomeLeader() {
    this.print('New role: LEADER');
    let nextIndex = new Map();
    let matchIndex = new Map();
    this._cluster.forEach(id => {
      nextIndex.set(id, this.serverState.logs.length + 1);
      matchIndex.set(id, 0);
    });
    this.role = new Leader(nextIndex, matchIndex);
    this._cluster.forEach(id => this.appendEntriesRequest(id, this.serverState.lastLogIndex, this.serverState.lastLogTerm));
    this.observer.restartHeartbeatTimer();
    this.observer.onStateChange(this.getMetaData());
  }


  private advanceCommitIndex() {
    if (this.role instanceof Leader) {
      let matchingIndices = Array.from(this.role.matchIndex.values())
        .filter(value => value > this.serverState.commitIndex && this.serverState.getLogTerm(value) === this.serverState.currentTerm);
      let majority = this.majority();
      if (matchingIndices.length < majority) {
        return;
      }
      matchingIndices.sort((a, b) => a - b);
      this.serverState.commitIndex = matchingIndices[majority - 1];
      this.serverState.fetchCommittedLogs().forEach(log => this.observer.onLog(log));
      this.print('Increased commitIndex to: ', this.serverState.commitIndex);
      this.observer.onStateChange(this.getMetaData());
    } else {
      this.warn('Cant advance commit as: ', this.role);
    }
  }

  private majority(): number {
    return Math.floor(this._cluster.size / 2) + 1;
  }

  public timeout() {
    if (this.role instanceof Follower || this.role instanceof Candidate) {
      this.print('Election timeout');
      this.becomeCandidate();
    }
    if (this.role instanceof Leader) {
      this.print('Heartbeat');
      for (const id of this._cluster) {
        let lastReplicated = this.role.matchIndex.get(id);
        if (lastReplicated !== undefined) {
          let missingLogs = this.serverState.getMissingLogs(lastReplicated);
          this.appendEntriesRequest(id, this.serverState.lastLogIndex, this.serverState.lastLogTerm, missingLogs);
        } else {
          this.warn('Missing matchIndex entry for : ', id);
        }
      }
      this.observer.restartHeartbeatTimer();
    }
  }

  public addNode(id: NodeId): boolean {
    let oldSize = this._cluster.size;
    this._cluster.add(id);
    if (this._cluster.size > oldSize) {
      if (this.role instanceof Leader) {
        this.role.nextIndex.set(id, this.serverState.logs.length + 1);
        this.role.matchIndex.set(id, 0);
      }
      return true;
    }
    return false;
  }

  private print(...data: any[]) {
    if (this.debug) {
      console.log(...data);
    }
  }

  private warn(...data: any[]) {
    if (this.debug) {
      console.warn(...data);
    }
  }


  public isLeader(): this is Leader {
    return this.role instanceof Leader;
  }

  public isFollower(): this is Follower {
    return this.role instanceof Follower;
  }

  public isCandidate(): this is Candidate {
    return this.role instanceof Candidate;
  }

  get nodeId(): NodeId {
    return this._nodeId;
  }

  get allLogs(): Log[] {
    return this.serverState.logs;
  }

  get clusterSize(): number {
    return this._cluster.size + 1;
  }

  get commitIndex(): number {
    return this.serverState.commitIndex;
  }

  get cluster(): Set<NodeId> {
    return this._cluster;
  }

  get term(): number {
    return this.serverState.currentTerm;
  }

  get lastLogIndex(): number {
    return this.serverState.lastLogIndex;
  }

  public getCurrentRole(): string {
    if (this.isCandidate()) {
      return 'Candidate';
    }
    if (this.isLeader()) {
      return 'Leader';
    }
    if (this.isFollower()) {
      return 'Follower';
    }
    return '';
  }

  public getMetaData(): RaftMetaData {
    return {
      lastLogIndex: this.lastLogIndex,
      role: this.getCurrentRole(),
      term: this.term
    };
  }
}
