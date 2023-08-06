import {LogIndex, NodeId} from "../Types";

export class Leader {

  constructor(
    private readonly _nextIndex: Map<NodeId, LogIndex>,
    private readonly _matchIndex: Map<NodeId, LogIndex>
  ) {

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
