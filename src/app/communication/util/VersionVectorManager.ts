import {VersionVector} from "../domain/VersionVector";

export class VersionVectorManager {
  private _versionVector: VersionVector = {};

  public update(id: string, timestamp: number): boolean {
    let lastId = this._versionVector[id] || -1;
    if (timestamp === (lastId + 1)) {
      this._versionVector[id] = timestamp;
      return true;
    }
    return false;
  }


  get versionVector(): VersionVector {
    return this._versionVector;
  }
}
