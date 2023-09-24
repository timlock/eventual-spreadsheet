import {Log} from "../domain/message/Log";
import {NodeId, RaftMessage} from "../domain/Types";
import {RaftMetaData} from "../util/RaftMetaData";

export interface RaftNodeObserver<T> {
  sendRaftMessage(destination: NodeId, message: RaftMessage<T>): void;

  sendLog(destination: NodeId, log: Log<T>): void

  onLog(log: Log<T>): void;

  restartHeartbeatTimer(): void;

  restartElectionTimer(): void;

  onStateChange(state: RaftMetaData): void;

}
