import {VectorClock} from "./VectorClock";

export interface Message<T> {
  source: string;
  destination?: string;
  payload?: T;
  logicalTimestamp?: number;
  vectorClock?: VectorClock;
  timestamp?: number;
}
