import {RaftMetaData} from "./RaftMetaData";
import {CommunicationServiceObserver} from "../../communication/controller/CommunicationServiceObserver";

export interface RaftServiceObserver<T> extends CommunicationServiceObserver<T>{
  onMessage(message: T): void;

  onNode(nodeId: string): void;

  onStateChange(state: RaftMetaData): void;


}
