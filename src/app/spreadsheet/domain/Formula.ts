import {Address} from "./Address";

export class Formula {
  private _type: FormulaType;
  private _range: [Address,Address];

  public constructor(type: FormulaType, range: [Address,Address]) {
    this._type = type;
    this._range = range;
  }

  public get type(): FormulaType {
    return this._type;
  }


  get range(): [Address,Address] {
    return this._range;
  }
}


export enum FormulaType {
  SUM = "SUM",
  MIN = "MIN",
  MAX = "MAX",
}
