import {Address} from "../domain/Address";

export interface Spreadsheet<T> {
  get rows(): string[];

  get columns(): string[];

  get(address: Address): T | undefined;

  getAddressRange(begin: Address, end: Address): Address[];
}
