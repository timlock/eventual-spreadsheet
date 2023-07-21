import {Payload} from "./Payload";
import {Action} from "../../communication/Action";
import {Address} from "../domain/Address";

export class PayloadFactory{
  static addRow(row: string): Payload{
    return {column: undefined, row: undefined, action: Action.ADD_ROW, input: row};
  }
  static insertRow(row: string, position: string): Payload{
    return {column: undefined, row: position, action: Action.INSERT_ROW, input: row};
  }
  static deleteRow(row: string): Payload{
    return {column: undefined, row: row, action: Action.DELETE_ROW, input: undefined};
  }
    static addColumn(column: string): Payload{
    return {column: undefined, row: undefined, action: Action.ADD_COLUMN, input: column};
  }
  static insertColumn(column: string, position: string): Payload{
    return {column: position, row: undefined, action: Action.INSERT_COLUMN, input: column};
  }
  static deleteColumn(column: string): Payload{
    return {column: column, row: undefined, action: Action.DELETE_COLUMN, input: undefined};
  }

  static insertCell(address: Address, input: string): Payload{
    return {column: address.column, row: address.row, action: Action.INSERT_CELL, input: input};
  }

}
