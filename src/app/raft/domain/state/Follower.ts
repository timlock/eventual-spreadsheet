import {NodeId} from "../Types";

export class Follower {

  constructor(private _leaderId?: NodeId) {
  }

  set leaderId(value: NodeId | undefined) {
    this._leaderId = value;
  }

  get leaderId(): NodeId | undefined {
    return this._leaderId;
  }
}
