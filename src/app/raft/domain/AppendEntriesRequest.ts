import {Log} from "./Log";
import {LogIndex, NodeId, RaftMessage, Term} from "./Types";

export interface AppendEntriesRequest {
  term: Term;
  leaderId: NodeId;
  prevLogIndex: LogIndex;
  prevLogTerm: Term | undefined;
  entries: Log[];
  leaderCommit: LogIndex;
}

export interface AppendEntriesResponse {
  term: Term;
  success: boolean;
  id: NodeId;
  lastLogIndex: LogIndex;
}

export function isAppendEntriesRequest(message: RaftMessage): message is AppendEntriesRequest {
  return (
    typeof message === 'object' &&
    'term' in message &&
    'leaderId' in message &&
    'prevLogIndex' in message &&
    'prevLogTerm' in message &&
    'entries' in message &&
    'leaderCommit' in message
  );
}

export function isAppendEntriesResponse(message: RaftMessage): message is AppendEntriesResponse {
  return (
    typeof message === 'object' &&
    'term' in message &&
    'success' in message &&
    'id' in message &&
    'lastLogIndex' in message
  );
}
