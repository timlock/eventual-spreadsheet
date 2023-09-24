import {Address} from "../spreadsheet/domain/Address";
import {Table} from "../spreadsheet/domain/Table";
import {OutputCell} from "../spreadsheet/domain/OutputCell";

export interface Spreadsheet<T> {
  addRow(id: string): T | undefined;

  insertRow(id: string, row: string): T | undefined;

  deleteRow(id: string): T | undefined;

  addColumn(id: string): T | undefined;

  insertColumn(id: string, column: string): T | undefined;

  deleteColumn(id: string): T | undefined;

  set(address: Address, input: string): T | undefined;

  renderTable(): Table<OutputCell>;

  applyUpdate(update: T): void;

  get rows(): string[];

  get columns(): string[];
}
