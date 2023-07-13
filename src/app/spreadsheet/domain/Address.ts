
export class Address {
  private readonly _column: string;
  private readonly _row: string;

  public constructor(column: string, row: string) {
    this._column = column;
    this._row = row;
  }

  public static of(column: string, row: string): Address{
    return new Address(column,row);
  }
  public toString(): string {
    return this._column + '|' + this._row;
  }

  get column(): string {
    return this._column;
  }

  get row(): string {
    return this._row;
  }

}
