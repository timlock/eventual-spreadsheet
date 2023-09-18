import {VectorClock} from "../domain/VectorClock";

export class VectorClockManager {
  private _vectorClock: VectorClock = {};

  public update(id: string, timestamp: number): boolean {
    const lastId = this._vectorClock[id] || -1;
    if (timestamp === (lastId + 1)) {
      this._vectorClock[id] = timestamp;
      return true;
    }
    return false;
  }


  get vectorClock(): VectorClock {
    return this._vectorClock;
  }
}
