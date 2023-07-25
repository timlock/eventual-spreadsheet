import {LogIndex, Term} from "../Types";
import {Log} from "../message/Log";

export class ServerState {
  private _currentTerm: Term = 0;
  private _votedFor: string | undefined;
  private _log: Log[];
  private _commitIndex: LogIndex = 0;
  private lastApplied: LogIndex = 0;


  constructor(logs: Log[] = []) {
    this._log = logs;
  }

  public fetchCommittedLogs(): Log[] {
    if (this.lastApplied < this.commitIndex) {
      let result = this._log.slice(this.lastApplied, this.commitIndex);
      this.lastApplied = this.commitIndex;
      return result;
    }
    return [];
  }

  public getMissingLogs(lastReplicated: LogIndex): Log[] {
    return this._log.slice(lastReplicated);
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
    return this._log[index - 1]?.term;
  }

  public hasLogAtIndex(index: LogIndex): boolean {
    return this._log[index - 1] !== undefined || index == 0;
  }

  get log(): Log[] {
    return this._log;
  }

  get commitIndex(): LogIndex {
    return this._commitIndex;
  }

  set commitIndex(value: LogIndex) {
    this._commitIndex = value;
  }


  get lastLogIndex(): LogIndex {
    return this._log.length
  }

  get lastLogTerm(): Term | undefined {
    return this._log[this._log.length - 1]?.term;
  }

  public isUpToDate(lastLogIndex: LogIndex, lastLogTerm?: Term): boolean {
    return (lastLogTerm !== undefined && this.lastLogTerm !== undefined && lastLogTerm >= this.lastLogTerm)
      || (lastLogTerm === this.lastLogTerm && lastLogIndex >= this.lastLogIndex)
      || (lastLogTerm !== undefined && this.lastLogTerm === undefined);
  }

}
