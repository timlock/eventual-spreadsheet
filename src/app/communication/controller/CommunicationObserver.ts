export interface CommunicationObserver<T> {
  onMessage(message: T, delay?: number): void;
  onNode(nodeId: string): void;
}
