import {LogIndex, NodeId, RaftMessage, Term} from "../Types";

export interface RequestVoteRequest {
  term: Term;
  candidateId: NodeId;
  lastLogIndex: LogIndex;
  lastLogTerm: Term | undefined;
}

export interface RequestVoteResponse {
  term: Term;
  voteGranted: boolean;
  id: NodeId;
}

export function isRequestVoteRequest<T>(message: RaftMessage<T>): message is RequestVoteRequest {
  return (
    typeof message === 'object' &&
    'term' in message &&
    'candidateId' in message &&
    'lastLogIndex' in message &&
    'lastLogTerm' in message
  );
}

export function isRequestVoteResponse<T>(message: RaftMessage<T>): message is RequestVoteResponse {
  return (
    typeof message === 'object' &&
    'term' in message &&
    'voteGranted' in message &&
    'id' in message
  );
}
