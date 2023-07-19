import {VersionVector} from "./VersionVector";

export interface Message<T> {
  source: string;
  destination?: string;
  payload?: T;
  timestamp?: number;
  versionVector?: VersionVector;
}


