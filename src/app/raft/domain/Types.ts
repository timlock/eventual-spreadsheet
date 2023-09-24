import {AppendEntriesRequest, AppendEntriesResponse} from "./message/AppendEntriesRequest";
import {RequestVoteRequest, RequestVoteResponse} from "./message/RequestVoteRequest";
import {Log} from "./message/Log";

export type Term = number;
export type LogIndex = number;
export type NodeId = string;
export type RaftMessage<T> = AppendEntriesRequest<T> | AppendEntriesResponse | RequestVoteRequest | RequestVoteResponse | Log<T>;

