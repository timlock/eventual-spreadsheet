import {Address} from "../domain/Address";

export class CellDto {
  private _address: Address;
  private _input: string;


  constructor(address: Address, input: string) {
    this._address = address;
    this._input = input;
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

  get input(): string {
    return this._input;
  }

  set input(value: string) {
    this._input = value;
  }

}
