import {Action} from "../domain/Action";
import {Address} from "../domain/Address";
import {Message} from "../../communication/Message";
import {Payload} from "../util/Payload";

export class MessageBuilder {
  private _sender: string | undefined;
  private _receiver: string | undefined;
  private _action: Action | undefined;
  private _address: Address | undefined;
  private _input: string | undefined;

  public constructor() {
  }

  public sender(value: string | undefined): MessageBuilder {
    this._sender = value;
    return this;
  }

  public receiver(value: string | undefined): MessageBuilder {
    this._receiver = value;
    return this;
  }

  public action(value: Action | undefined): MessageBuilder {
    this._action = value;
    return this;
  }

  public address(value: Address | undefined): MessageBuilder {
    this._address = value;
    return this;
  }

  public input(value: string | undefined): MessageBuilder {
    this._input = value;
    return this;
  }

  public build(): Message<Payload> | undefined {
    if (this._sender === undefined || this._action == undefined) {
      return undefined;
    }
    return {
      sender: this._sender,
      destination: this._receiver,
      payload: {
        action: this._action,
        column: this._address?.column,
        row: this._address?.row,
        input: this._input
      }
    };
  }
}
