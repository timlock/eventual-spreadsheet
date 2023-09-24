import {RaftMetaData} from "./RaftMetaData";
import {CommunicationObserver} from "../../communication/controller/CommunicationObserver";

export interface RaftServiceObserver<T> extends CommunicationObserver<T>{
  onMessage(message: T, delay?: number): void;

  onNode(nodeId: string): void;

  onStateChange(state: RaftMetaData): void;

}
