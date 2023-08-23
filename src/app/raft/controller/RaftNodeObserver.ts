import {Log} from "../domain/message/Log";
import {NodeId, RaftMessage} from "../domain/Types";
import {RaftMetaData} from "../util/RaftMetaData";

export interface RaftNodeObserver {
  sendRaftMessage(receiver: NodeId, message: RaftMessage): void;

  onLog(log: Log): void;

  restartHeartbeatTimer(): void;

  restartElectionTimer(): void;

  onStateChange(state: RaftMetaData): void;

}
