import {NodeId} from "../Types";

export class Follower {
  private _leaderId: NodeId | undefined;

  constructor(leaderId?: NodeId) {
    this._leaderId = leaderId;
  }

  set leaderId(value: NodeId | undefined) {
    this._leaderId = value;
  }

  get leaderId(): NodeId | undefined {
    return this._leaderId;
  }
}
