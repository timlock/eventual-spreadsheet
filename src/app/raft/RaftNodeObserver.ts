import {Log} from "./domain/message/Log";
import {NodeId, RaftMessage} from "./domain/Types";
import {RaftMetaData} from "./RaftMetaData";

export interface RaftNodeObserver {
  sendMessage(receiver: NodeId, message: RaftMessage): void;

  onLog(log: Log): void;

  restartHeartbeatTimer(): void;

  restartElectionTimer(): void;

  onStateChange(state: RaftMetaData): void;

  onLogsCorrected(log: Log[]): void;
}
