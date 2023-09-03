import {Log} from "./Log";
import {LogIndex, NodeId, RaftMessage, Term} from "../Types";

export interface AppendEntriesRequest<T> {
  term: Term;
  leaderId: NodeId;
  prevLogIndex: LogIndex;
  prevLogTerm: Term | undefined;
  entries: Log<T>[];
  leaderCommit: LogIndex;
}

export interface AppendEntriesResponse {
  term: Term;
  success: boolean;
  id: NodeId;
  lastLogIndex: LogIndex;
}

export function isAppendEntriesRequest<T>(message: RaftMessage<T>): message is AppendEntriesRequest<T> {
  return (
    typeof message === 'object' &&
    'term' in message &&
    'leaderId' in message &&
    'prevLogIndex' in message &&
    // 'prevLogTerm' in message &&
    'entries' in message &&
    'leaderCommit' in message
  );
}

export function isAppendEntriesResponse<T>(message: RaftMessage<T>): message is AppendEntriesResponse {
  return (
    typeof message === 'object' &&
    'term' in message &&
    'success' in message &&
    'id' in message &&
    'lastLogIndex' in message
  );
}
