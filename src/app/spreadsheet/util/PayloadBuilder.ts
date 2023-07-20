import {Action} from "../../communication/Action";
import {Payload} from "./Payload";
import {Address} from "../domain/Address";

export class PayloadBuilder {
  private _action: Action | undefined;
  private _address: Address | undefined;
  private _input: string | undefined;

  public action(value: Action | undefined): PayloadBuilder {
    this._action = value;
    return this;
  }

  public address(value: Address | undefined): PayloadBuilder {
    this._address = value;
    return this;
  }

  public input(value: string | undefined): PayloadBuilder {
    this._input = value;
    return this;
  }

  public build(): Payload | undefined {
    if (this._action == undefined) {
      return undefined;
    }
    return {
      action: this._action,
      column: this._address?.column,
      row: this._address?.row,
      input: this._input
    }
  };

}
