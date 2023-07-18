export interface RaftServiceObserver<T> {
  onMessage(message: T): void;

  onNode(nodeId: string): void;

  onRoleChange(newRole: string): void;
}
