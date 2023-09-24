import {Address} from "../domain/Address";

export interface Solvable<T> {
  get rows(): string[];

  get columns(): string[];

  get(address: Address): T | undefined;

  getAddressRange(begin: Address, end: Address): Address[];
}
