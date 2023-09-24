import {Address} from "./Address";

export interface OutputCell {
  readonly address: Address;
  readonly columnIndex: number;
  readonly rowIndex: number;
  readonly input: string;
  readonly content: string | number;
}
