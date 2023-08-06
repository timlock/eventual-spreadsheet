import {LogIndex, Term} from "../Types";
import {Log} from "../message/Log";

export class ServerState {
  private _currentTerm: Term = 0;
  private _votedFor: string | undefined;
  private _commitIndex: LogIndex = 0;
  private lastApplied: LogIndex = 0;


  constructor(private _logs: Log[] = []) {
  }

  public fetchCommittedLogs(): Log[] {
    if (this.lastApplied < this.commitIndex) {
      let result = this._logs.slice(this.lastApplied, this.commitIndex);
      this.lastApplied = this.commitIndex;
      return result;
    }
    return [];
  }

  public getMissingLogs(lastReplicated: LogIndex): Log[] {
    return this._logs.slice(lastReplicated);
  }

  public replaceInvalidLogs(logIndex: LogIndex): boolean {
    if (this._logs[logIndex] === undefined) {
      return false;
    }
    this._logs.splice(logIndex);
    return true;
  }

  get currentTerm(): Term {
    return this._currentTerm;
  }

  set currentTerm(value: Term) {
    this._currentTerm = value;
  }

  get votedFor(): string | undefined {
    return this._votedFor;
  }

  set votedFor(value: string | undefined) {
    this._votedFor = value;
  }

  public getLogTerm(index: LogIndex): number | undefined {
    return this._logs[index - 1]?.term;
  }

  public hasLogAtIndex(index: LogIndex): boolean {
    return this._logs[index - 1] !== undefined || index == 0;
  }

  get logs(): Log[] {
    return this._logs;
  }

  get commitIndex(): LogIndex {
    return this._commitIndex;
  }

  set commitIndex(value: LogIndex) {
    this._commitIndex = value;
  }


  get lastLogIndex(): LogIndex {
    return this._logs.length
  }

  get lastLogTerm(): Term | undefined {
    return this._logs[this._logs.length - 1]?.term;
  }

  public isUpToDate(lastLogIndex: LogIndex, lastLogTerm?: Term): boolean {
    return (lastLogTerm !== undefined && this.lastLogTerm !== undefined &&
        (lastLogTerm > this.lastLogTerm || lastLogTerm === this.lastLogTerm && lastLogIndex > this.lastLogIndex))
      || (lastLogTerm === this.lastLogTerm && lastLogIndex >= this.lastLogIndex)
      || (lastLogTerm !== undefined && this.lastLogTerm === undefined);
  }

}
