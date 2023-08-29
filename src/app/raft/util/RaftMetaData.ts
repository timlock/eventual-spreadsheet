export interface RaftMetaData{
  role: string,
  term: number,
  lastLogIndex: number,
  lastAppliedLog: number
}
