import {Address} from "../domain/Address";

export interface Spreadsheet<T> {
  get rows(): string[];

  get columns(): string[];

  get(address: Address): T | undefined;

  getAddressRange(range: [Address, Address]): Address[];
}
