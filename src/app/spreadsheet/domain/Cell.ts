import {Formula} from "./Formula";

export interface Cell {
  readonly input: string;
  readonly content?: number | string | Formula;
}
