import {AppendEntriesRequest, AppendEntriesResponse} from "./AppendEntriesRequest";
import {RequestVoteRequest, RequestVoteResponse} from "./RequestVoteRequest";
import {Log} from "./Log";

export type Term = number;
export type LogIndex = number;
export type NodeId = string;
export type RaftMessage = AppendEntriesRequest | AppendEntriesResponse | RequestVoteRequest | RequestVoteResponse | Log;

