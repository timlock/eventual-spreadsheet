import {Injectable} from '@angular/core';
import {OutputCell} from "../domain/OutputCell";
import {CellParser} from "../util/CellParser";
import {InputCell} from "../domain/InputCell";
import {Address} from "../domain/Address";
import {Table} from "../domain/Table";
import {SpreadsheetSolver} from "./SpreadsheetSolver";
import {Identifier} from "../../identifier/Identifier";
import {Action} from "../util/Action";
import {PayloadFactory} from "../util/PayloadFactory";

@Injectable({
  providedIn: 'root'
})
export class SpreadsheetService {
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


  public addRow(id: string): Action {
    this.table.addRow(id);
    this.spreadsheetSolver.reset();
    return PayloadFactory.addRow(id);

  }

  public insertRow(id: string, row: string): Action {
    this.table.insertRow(id, row);
    this.spreadsheetSolver.reset();
    return PayloadFactory.insertRow(id, row);
  }

  public deleteRow(id: string): Action {
    this.table.deleteRow(id);
    this.spreadsheetSolver.reset();
    return PayloadFactory.deleteRow(id);
  }

  public addColumn(id: string): Action {
    this.table.addColumn(id);
    this.spreadsheetSolver.reset();
    return PayloadFactory.addColumn(id);
  }

  public insertColumn(id: string, column: string): Action {
    this.table.insertColumn(id, column);
    this.spreadsheetSolver.reset();
    return PayloadFactory.insertColumn(id, column);
  }

  public deleteColumn(id: string): Action {
    this.table.deleteColumn(id);
    this.spreadsheetSolver.reset();
    return PayloadFactory.deleteColumn(id);
  }

  public insertCellById(address: Address, input: string): Action {
    if (input.trim().length === 0) {
      this.deleteCell(address);
    } else {
      const cell = CellParser.parseCell(input);
      this.table.set(address, cell);
    }
    this.spreadsheetSolver.reset();
    return PayloadFactory.insertCell(address, input);
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
