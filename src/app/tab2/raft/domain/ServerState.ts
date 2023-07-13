import {LogIndex, Term} from "./Types";
import {Log} from "./Log";

export class ServerState {
  private _currentTerm: Term;
  private _votedFor: string | undefined;
  private _log: Log[];
  private _commitIndex: LogIndex;
  private lastApplied: LogIndex;


  constructor(logs: Log[] = []) {
    this._currentTerm = 0;
    this._log = logs;
    this._commitIndex = 0;
    this.lastApplied = 0;
  }

  public fetchCommittedLogs(): Log[] {
    if (this.lastApplied < this.commitIndex) {
      let result = this._log.slice(this.lastApplied - 1, this.commitIndex);
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

  public isUpToDate(logIndex: LogIndex, term?: Term): boolean {
    return (term !== undefined && this.lastLogTerm !== undefined && term >= this.lastLogTerm)
      || (term == this.lastLogTerm && logIndex >= this.lastLogIndex)
      || (term !== undefined && this.lastLogTerm === undefined);
  }

}
