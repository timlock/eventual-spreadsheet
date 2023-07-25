import {Action} from "../../communication/Action";

export interface Payload {
  action: string;
  column: string | undefined;
  row: string | undefined;
  input: string | undefined;
}

export function isPayload(payload: Payload): boolean {
  switch (payload.action) {
    case Action.ADD_ROW :
      return isAddRow(payload);
    case Action.INSERT_ROW :
      return isInsertRow(payload);
    case Action.DELETE_ROW :
      return isDeleteRow(payload);
    case Action.ADD_COLUMN :
      return isAddColumn(payload);
    case Action.INSERT_COLUMN :
      return isInsertColumn(payload);
    case Action.DELETE_COLUMN :
      return isDeleteColumn(payload);
    case Action.INSERT_CELL :
      return isInsertCell(payload);
    default:
      return false;
  }
}

export function isAddRow(payload: Payload): boolean {
  return payload.action === Action.ADD_ROW && payload.input !== undefined;
}

export function isInsertRow(payload: Payload): boolean {
  return payload.action === Action.INSERT_ROW && payload.input !== undefined && payload.row !== undefined;
}

export function isDeleteRow(payload: Payload): boolean {
  return payload.action === Action.DELETE_ROW && payload.row !== undefined;

}

export function isAddColumn(payload: Payload): boolean {
  return payload.action === Action.ADD_COLUMN && payload.input !== undefined;

}

export function isInsertColumn(payload: Payload): boolean {
  return payload.action === Action.INSERT_COLUMN && payload.input !== undefined && payload.column !== undefined;

}

export function isDeleteColumn(payload: Payload): boolean {
  return payload.action === Action.DELETE_COLUMN && payload.column !== undefined;

}

export function isInsertCell(payload: Payload): boolean {
  return payload.action === Action.INSERT_CELL && payload.input !== undefined && payload.row !== undefined && payload.column !== undefined;

}
