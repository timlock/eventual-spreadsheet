import {Action} from "../../communication/Action";

export interface Payload {
  action: string;
  column: string | undefined;
  row: string | undefined;
  input: string | undefined;
}

export function isPayload(payload: Payload): boolean {
  switch (payload.action) {
    case Action.INSERT_CELL:
    case Action.ADD_ROW:
    case Action.INSERT_ROW:
    case Action.ADD_COLUMN:
    case Action.INSERT_COLUMN: {
      if (payload.input === undefined) {
        return false;
      }
      switch (payload.action) {
        case Action.INSERT_CELL:
        case Action.INSERT_ROW:
        case Action.INSERT_COLUMN: {
          if (payload.column === undefined || payload.row === undefined) {
            return false;
          }
        }
      }
    }
      break;
    case Action.DELETE_COLUMN:
    case Action.DELETE_ROW: {
      if (payload.column === undefined || payload.row === undefined) {
        return false;
      }
    }
      break;
    default:
      return false;
  }
  return true;
}
