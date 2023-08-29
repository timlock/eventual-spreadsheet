import {Injectable} from '@angular/core';
import {OutputCell} from "../domain/OutputCell";
import {CellParser} from "../util/CellParser";
import {InputCell} from "../domain/InputCell";
import {Address} from "../domain/Address";
import {Table} from "../domain/Table";
import {SpreadsheetSolver} from "./SpreadsheetSolver";
import {Identifier} from "../../identifier/Identifier";

@Injectable({
  providedIn: 'root'
})
export class SpreadsheetService{
  private table: Table<InputCell> = new Table();
  private spreadsheetSolver: SpreadsheetSolver = new SpreadsheetSolver(this.table);

  public constructor() {
    this.fillTable();
  }

  private fillTable() {
    const counter = new Identifier('init')
    for (let i = 0; i < 10; i++) {
      this.addRow(counter.next());
      this.addColumn(counter.next());
    }
    this.spreadsheetSolver.reset();
  }


  public addRow(id: string) {
    this.table.addRow(id);
    this.spreadsheetSolver.reset();
  }

  public insertRow(id: string, row: string) {
    this.table.insertRow(id, row);
    this.spreadsheetSolver.reset();
  }

  public deleteRow(id: string) {
    this.table.deleteRow(id);
    this.spreadsheetSolver.reset();
  }

  public addColumn(id: string) {
    this.table.addColumn(id);
    this.spreadsheetSolver.reset();
  }

  public insertColumn(id: string, column: string) {
    this.table.insertColumn(id, column);
    this.spreadsheetSolver.reset();
  }

  public deleteColumn(id: string) {
    this.table.deleteColumn(id);
    this.spreadsheetSolver.reset();
  }

  public insertCellById(address: Address, input: string) {
    if (input.trim().length === 0) {
      this.deleteCell(address);
    } else {
      const cell = CellParser.parseCell(input);
      this.table.set(address, cell);
    }
    this.spreadsheetSolver.reset();
  }

  public deleteCell(address: Address) {
    this.table.deleteValue(address);
    this.spreadsheetSolver.reset();
  }

  public renderTable(): Table<OutputCell> {
    return this.spreadsheetSolver.solve();
  }
  get rows(): string[] {
    return this.table.rows;
  }

  get columns(): string[] {
    return this.table.columns;
  }

}
