import {Action} from "./Action";
import {ActionType} from "../domain/ActionType";
import {Address} from "../domain/Address";

export class PayloadFactory{
  static addRow(row: string): Action{
    return {column: undefined, row: undefined, action: ActionType.ADD_ROW, input: row};
  }
  static insertRow(row: string, position: string): Action{
    return {column: undefined, row: position, action: ActionType.INSERT_ROW, input: row};
  }
  static deleteRow(row: string): Action{
    return {column: undefined, row: row, action: ActionType.DELETE_ROW, input: undefined};
  }
    static addColumn(column: string): Action{
    return {column: undefined, row: undefined, action: ActionType.ADD_COLUMN, input: column};
  }
  static insertColumn(column: string, position: string): Action{
    return {column: position, row: undefined, action: ActionType.INSERT_COLUMN, input: column};
  }
  static deleteColumn(column: string): Action{
    return {column: column, row: undefined, action: ActionType.DELETE_COLUMN, input: undefined};
  }

  static insertCell(address: Address, input: string): Action{
    return {column: address.column, row: address.row, action: ActionType.INSERT_CELL, input: input};
  }

}
