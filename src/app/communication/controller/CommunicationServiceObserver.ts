export interface CommunicationServiceObserver<T> {
  onMessage(message: T, source: string): void;
  onNode(nodeId: string): void;
  onMessageCounterUpdate(received: number, total: number): void;
}
