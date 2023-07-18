import {Action} from "../domain/Action";
import {Address} from "../domain/Address";
import {Payload} from "../util/Payload";

export class PayloadBuilder {
  private _action: Action | undefined;
  private _address: Address | undefined;
  private _input: string | undefined;

  public constructor() {
  }

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
