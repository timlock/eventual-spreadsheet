export interface CommunicationServiceObserver<T> {
  onMessage(message: T): void;
  onNode(nodeId: string): void;
  onMessageCounterUpdate(received: number, total: number): void;
}
