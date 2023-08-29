import {Formula} from "./Formula";

export interface InputCell {
  readonly input: string;
  readonly content: number | string | Formula;
}
