import {Formula} from "./Formula";

export interface Cell {
  rawInput: string;
  content?: number | string | Formula;
}

export function emptyCell(): Cell{
  return {rawInput: '', content: undefined}
}
