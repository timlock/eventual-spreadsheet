import {VersionVector} from "./VersionVector";

export interface Message<T> {
  sender: string;
  destination?: string;
  payload?: T;
  timestamp?: number;
  versionVector?: VersionVector;
}


