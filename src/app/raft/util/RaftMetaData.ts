export interface RaftMetaData{
  role: string,
  term: number,
  lastLogIndex: number,
  commitIndex: number,
  lastAppliedLog: number
}
