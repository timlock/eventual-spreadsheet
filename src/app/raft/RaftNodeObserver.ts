import {Log} from "./domain/Log";
import {NodeId, RaftMessage} from "./domain/Types";

export interface RaftNodeObserver {
  sendMessage(receiver: NodeId, message: RaftMessage): void;

  onLog(log: Log): void;

  restartHeartbeatTimer(): void;

  restartElectionTimer(): void;
}
