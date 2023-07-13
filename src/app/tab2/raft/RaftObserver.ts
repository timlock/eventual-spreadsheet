import {Log} from "./domain/Log";
import {NodeId, RaftMessage} from "./domain/Types";

export interface RaftObserver {
  sendMessage(receiver: NodeId, message: RaftMessage): void;

  onLog(log: Log): void;

  restartHeartbeatTimer(): void;

  restartElectionTimer(): void;
}
