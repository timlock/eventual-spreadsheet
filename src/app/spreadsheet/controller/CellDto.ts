import {Address} from "../domain/Address";

export interface CellDto {
  readonly address: Address;
  readonly  columnIndex: number;
  readonly  rowIndex: number;
  readonly input: string;
  readonly  content: string | number;
}
