export interface CommunicationObserver<T> {
  onMessage(message: T): void;
  onNode(nodeId: string): void;
}
