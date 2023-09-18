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


export class RaftNode<T> {
  private role: Leader | Candidate | Follower = new Follower();
  private serverState: ServerState<T>;
  private _cluster: Set<NodeId> = new Set();
  private commandBuffer: any[] = [];


  constructor(
    private readonly _nodeId: NodeId,
    private readonly observer: RaftNodeObserver<T>,
    private debug = false,
    logs: Log<T>[] = []
  ) {
    this.serverState = new ServerState(logs);
  }

  public start() {
    this.timeout();
  }

  public handleMessage(message: RaftMessage<T>) {
    if (message !== undefined) {
      if (isRequestVoteRequest(message)) {
        this.handleRequestVoteRequest(message)
      } else if (isRequestVoteResponse(message)) {
        this.handleRequestVoteResponse(message);
      } else if (isAppendEntriesRequest(message)) {
        this.handleAppendEntriesRequest(message);
      } else if (isAppendEntriesResponse(message)) {
        this.handleAppendEntriesResponse(message);
      } else if (isLog<T>(message)) {
        this.handleCommand(message);
      } else {
        console.warn('invalid message: ', message);
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
      this.observer.restartElectionTimer();
      this.serverState.votedFor = request.candidateId;
      voteGranted = true;
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


  private handleAppendEntriesRequest(request: AppendEntriesRequest<T>) {
    this.print('Handle AppendEntriesRequest: ', request);
    if (request.term > this.serverState.currentTerm || (!(this.role instanceof Follower) && this.serverState.currentTerm === request.term)) {
      this.becomeFollower(request.term, request.leaderId);
    }
    this.observer.restartElectionTimer();
    if (request.term < this.serverState.currentTerm
      || !this.serverState.hasLogAtIndex(request.prevLogIndex)
      || request.prevLogTerm !== this.serverState.getLogTerm(request.prevLogIndex)) {
      this.print('Declined request term: ' + request.term + ' currentTerm: ' + this.serverState.currentTerm + ' request prevLogIndex: ' + request.prevLogIndex + ' current lastLogIndex: ' + this.serverState.lastLogIndex + ' request prevLogTerm: ' + request.prevLogTerm + ' current logTermAt: ' + this.serverState.getLogTerm(request.prevLogIndex));
      this.appendEntriesResponse(request.leaderId, false);
      return;
    }
    if (this.role instanceof Follower && this.role.leaderId === undefined && this.serverState.currentTerm === request.term) {
      this.role.leaderId = request.leaderId;
    }
    // const newIndex = request.prevLogIndex;
    // for (const log of request.entries) {
    //   newIndex++;
    //   const oldEntry = this.serverState.log[newIndex - 1];
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
    const removedLogs = this.serverState.replaceInvalidLogs(request.prevLogIndex);
    if (removedLogs) {
      this.print('Removed invalid logs after index ', request.prevLogIndex);
    }
    this.serverState.logs.push(...request.entries)
    if (request.leaderCommit > this.serverState.commitIndex) {
      this.serverState.commitIndex = Math.min(request.leaderCommit, this.serverState.lastLogIndex);
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
      this.becomeFollower(response.term);
      return;
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
        const prevLogIndex = this.role.nextIndex.get(response.id);
        if (prevLogIndex === undefined) {
          this.warn('Missing entry in nextIndex for: ', response.id);
          return;
        }
        const prevLogTerm = this.serverState.getLogTerm(prevLogIndex)!;
        const logs = this.serverState.getMissingLogs(prevLogIndex);
        this.appendEntriesRequest(response.id, prevLogIndex, prevLogTerm, logs);
        return;
      }
    } else {
      this.warn('handleAppendEntriesResponse: node is not leader ', response);
    }
  }

  public command(command: T) {
    if (this.role instanceof Follower && this.role.leaderId !== undefined) {
      this.log(this.role.leaderId, command)
    } else if (this.role instanceof Leader) {
      const log: Log<T> = {term: this.serverState.currentTerm, content: command};
      this.handleCommand(log);
    } else {
      this.commandBuffer.push(command);
    }
  }

  private handleCommand(log: Log<T>) {
    if (this.role instanceof Leader) {
      this.print('Received command: ', log);
      const prevLogIndex = this.serverState.lastLogIndex;
      const prevLogTerm = this.serverState.lastLogTerm;
      this.serverState.logs.push(log);
      this._cluster.forEach(id => this.appendEntriesRequest(id, prevLogIndex, prevLogTerm, [log]));
    } else {
      this.warn('Cant handle command as: ', this.role)
    }
  }

  private requestVoteRequest(destination: NodeId) {
    const message: RequestVoteRequest = {
      term: this.serverState.currentTerm,
      candidateId: this._nodeId,
      lastLogIndex: this.serverState.lastLogIndex,
      lastLogTerm: this.serverState.getLogTerm(this.serverState.lastLogIndex)!
    }
    this.observer.sendRaftMessage(destination, message);
    this.print('Send requestVoteRequest: ', message);
  }

  private requestVoteResponse(destination: NodeId, voteGranted: boolean) {
    const message: RequestVoteResponse = {
      term: this.serverState.currentTerm,
      voteGranted: voteGranted,
      id: this.nodeId
    }
    this.observer.sendRaftMessage(destination, message);
    this.print('Send requestVoteResponse: ', message);
  }

  private appendEntriesRequest(destination: NodeId, prevLogIndex: LogIndex, prevLogTerm: Term | undefined, entries: Log<T>[] = []) {
    const message: AppendEntriesRequest<T> = {
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
    const message: AppendEntriesResponse = {
      term: this.serverState.currentTerm,
      success: success,
      id: this.nodeId,
      lastLogIndex: this.serverState.lastLogIndex
    }
    this.observer.sendRaftMessage(destination, message);
    this.print('Send appendEntriesResponse: ', message);
  }

  private log(destination: NodeId, command: any) {
    const message: Log<T> = {term: this.serverState.currentTerm, content: command};
    this.observer.sendLog(destination, message);
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
    const nextIndex = new Map();
    const matchIndex = new Map();
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
      const matchingIndices = Array.from(this.role.matchIndex.values())
        .filter(value => value > this.serverState.commitIndex && this.serverState.getLogTerm(value) === this.serverState.currentTerm);
      const majority = this.majority();
      if (matchingIndices.length < majority) {
        this.print(`Cant advance commit index ${this.serverState.commitIndex} required ${matchingIndices.length}/${majority}`, this.role.matchIndex.values())
        return;
      }
      matchingIndices.sort((a, b) => a - b);
      this.serverState.commitIndex = matchingIndices[0];
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
        this.appendEntriesRequest(id, this.serverState.lastLogIndex, this.serverState.lastLogTerm);
        // const lastReplicated = this.role.matchIndex.get(id);
        // if (lastReplicated !== undefined) {
        //   const missingLogs = this.serverState.getMissingLogs(lastReplicated);
        //   this.appendEntriesRequest(id, this.serverState.lastLogIndex, this.serverState.lastLogTerm, missingLogs);
        // } else {
        //   this.warn('Missing matchIndex entry for : ', id);
        // }
      }
      this.observer.restartHeartbeatTimer();
    }
  }

  public addNode(id: NodeId): boolean {
    const oldSize = this._cluster.size;
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

  get allLogs(): Log<T>[] {
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
      lastLogIndex: this.serverState.lastLogIndex,
      role: this.getCurrentRole(),
      term: this.term,
      commitIndex: this.serverState.commitIndex,
      lastAppliedLog: this.serverState.lastApplied,

    };
  }
}
