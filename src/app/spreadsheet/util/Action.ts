import {ActionType} from "./ActionType";

export interface Action {
  action: string;
  column: string | undefined;
  row: string | undefined;
  input: string | undefined;
}

export function isPayload(payload: Action): boolean {
  switch (payload.action) {
    case ActionType.ADD_ROW :
      return isAddRow(payload);
    case ActionType.INSERT_ROW :
      return isInsertRow(payload);
    case ActionType.DELETE_ROW :
      return isDeleteRow(payload);
    case ActionType.ADD_COLUMN :
      return isAddColumn(payload);
    case ActionType.INSERT_COLUMN :
      return isInsertColumn(payload);
    case ActionType.DELETE_COLUMN :
      return isDeleteColumn(payload);
    case ActionType.INSERT_CELL :
      return isInsertCell(payload);
    default:
      return false;
  }
}

export function isAddRow(payload: Action): boolean {
  return payload.action === ActionType.ADD_ROW && payload.input !== undefined;
}

export function isInsertRow(payload: Action): boolean {
  return payload.action === ActionType.INSERT_ROW && payload.input !== undefined && payload.row !== undefined;
}

export function isDeleteRow(payload: Action): boolean {
  return payload.action === ActionType.DELETE_ROW && payload.row !== undefined;

}

export function isAddColumn(payload: Action): boolean {
  return payload.action === ActionType.ADD_COLUMN && payload.input !== undefined;

}

export function isInsertColumn(payload: Action): boolean {
  return payload.action === ActionType.INSERT_COLUMN && payload.input !== undefined && payload.column !== undefined;

}

export function isDeleteColumn(payload: Action): boolean {
  return payload.action === ActionType.DELETE_COLUMN && payload.column !== undefined;

}

export function isInsertCell(payload: Action): boolean {
  return payload.action === ActionType.INSERT_CELL && payload.input !== undefined && payload.row !== undefined && payload.column !== undefined;

}
