import {RaftMetaData} from "./RaftMetaData";

export interface RaftServiceObserver<T> {
  onMessage(message: T): void;

  onNode(nodeId: string): void;

  onStateChange(state: RaftMetaData): void;

}
