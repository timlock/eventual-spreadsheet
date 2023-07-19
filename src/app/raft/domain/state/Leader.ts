import {LogIndex, NodeId} from "../Types";

export class Leader {
  private readonly _nextIndex: Map<NodeId, LogIndex>;
  private readonly _matchIndex: Map<NodeId, LogIndex>;


  constructor(nextIndex: Map<NodeId, LogIndex>, matchIndex: Map<NodeId, LogIndex>) {
    this._nextIndex = nextIndex;
    this._matchIndex = matchIndex;
  }

  get nextIndex(): Map<NodeId, LogIndex> {
    return this._nextIndex;
  }

  get matchIndex(): Map<NodeId, LogIndex> {
    return this._matchIndex;
  }

  public decrementNexIndex(id: NodeId) {
    let currentIndex = this._nextIndex.get(id);
    if (currentIndex !== undefined && currentIndex > 0) {
      currentIndex--
      this._nextIndex.set(id, currentIndex);
    }
  }

}
