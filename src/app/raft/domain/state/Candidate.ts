import {NodeId} from "../Types";

export class Candidate {
  private readonly votes: Set<NodeId>;

  constructor() {
    this.votes = new Set();
  }

  public addVote(nodeId: NodeId) {
    this.votes.add(nodeId);
  }

  public countVotes(): number {
    return this.votes.size;
  }
}
