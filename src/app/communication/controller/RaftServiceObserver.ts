import {RaftMetaData} from "../../raft/RaftMetaData";
import {Log} from "../../raft/domain/message/Log";

export interface RaftServiceObserver<T> {
  onMessage(message: T): void;

  onNode(nodeId: string): void;

  onStateChange(state: RaftMetaData): void;

  onLogsCorrected(log: T[]): void;

}
