import {Formula} from "./Formula";

export class Cell {
  private readonly _rawInput: string;
  private readonly _content?: number | Formula;


  public constructor(rawInput: string, content?: number | Formula) {
    this._rawInput = rawInput;
    this._content = content;
  }

  public static zero(): Cell {
    return new Cell('0', 0);
  }

  public static empty(): Cell {
    return new Cell('');
  }


  get rawInput(): string {
    return this._rawInput;
  }

  get content(): number | Formula | undefined {
    return this._content;
  }
}
