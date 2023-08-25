import {Formula} from "./Formula";

export interface Cell {
  readonly rawInput: string;
  readonly content?: number | string | Formula;
}

export function emptyCell(): Cell{
  return {rawInput: '', content: undefined}
}
