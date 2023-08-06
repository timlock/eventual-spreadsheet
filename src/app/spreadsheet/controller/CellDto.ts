import {Address} from "../domain/Address";

export class CellDto {
  constructor(
    private _address: Address,
    private _colIndex: number,
    private _rowIndex: number,
    private _input = '',
    private _content?: string
  ) {
  }

  get address(): Address {
    return this._address;
  }

  set address(value: Address) {
    this._address = value;
  }

  get column(): string {
    return this._address.column;
  }

  get row(): string {
    return this._address.row;
  }


  get colIndex(): number {
    return this._colIndex;
  }

  set colIndex(value: number) {
    this._colIndex = value;
  }

  get rowIndex(): number {
    return this._rowIndex;
  }

  set rowIndex(value: number) {
    this._rowIndex = value;
  }

  get input(): string {
    return this._input;
  }

  set input(value: string) {
    this._input = value;
  }


  get content(): string | undefined {
    return this._content;
  }

  set content(value: string | undefined) {
    this._content = value;
  }
}
