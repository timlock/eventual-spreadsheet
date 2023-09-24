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
import {Spreadsheet} from "../../test-environment/Spreadsheet";
import {ActionType} from "../util/ActionType";

@Injectable({
  providedIn: 'root'
})
export class SpreadsheetService implements Spreadsheet<Action>{
  private inputTable: Table<InputCell> = new Table();
  private spreadsheetSolver: SpreadsheetSolver = new SpreadsheetSolver(this.inputTable);

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
    this.inputTable.addRow(id);
    this.spreadsheetSolver.reset();
    return PayloadFactory.addRow(id);

  }

  public insertRow(id: string, row: string): Action {
    this.inputTable.insertRow(id, row);
    this.spreadsheetSolver.reset();
    return PayloadFactory.insertRow(id, row);
  }

  public deleteRow(id: string): Action {
    this.inputTable.deleteRow(id);
    this.spreadsheetSolver.reset();
    return PayloadFactory.deleteRow(id);
  }

  public addColumn(id: string): Action {
    this.inputTable.addColumn(id);
    this.spreadsheetSolver.reset();
    return PayloadFactory.addColumn(id);
  }

  public insertColumn(id: string, column: string): Action {
    this.inputTable.insertColumn(id, column);
    this.spreadsheetSolver.reset();
    return PayloadFactory.insertColumn(id, column);
  }

  public deleteColumn(id: string): Action {
    this.inputTable.deleteColumn(id);
    this.spreadsheetSolver.reset();
    return PayloadFactory.deleteColumn(id);
  }

  public set(address: Address, input: string): Action {
    if (input.trim().length === 0) {
      this.deleteCell(address);
    } else {
      const cell = CellParser.parseCell(input);
      this.inputTable.set(address, cell);
    }
    this.spreadsheetSolver.reset();
    return PayloadFactory.insertCell(address, input);
  }

  private deleteCell(address: Address) {
    this.inputTable.deleteValue(address);
    this.spreadsheetSolver.reset();
  }

  public applyUpdate(update: Action) {
    switch (update.action) {
      case ActionType.INSERT_CELL:
        const address: Address = {column: update.column!, row: update.row!};
        this.set(address, update.input!);
        break;
      case ActionType.ADD_ROW:
        this.addRow(update.input!);
        break;
      case ActionType.INSERT_ROW:
        this.insertRow(update.input!, update.row!)
        break;
      case ActionType.ADD_COLUMN:
        this.addColumn(update.input!);
        break;
      case ActionType.INSERT_COLUMN:
        this.insertColumn(update.input!, update.column!);
        break;
      case ActionType.DELETE_COLUMN:
        this.deleteColumn(update.column!);
        break;
      case ActionType.DELETE_ROW:
        this.deleteRow(update.row!)
        break;
      default:
        console.warn('Cant perform update for update: ', update);
        break;
    }
  }

  public renderTable(): Table<OutputCell> {
    return this.spreadsheetSolver.solve();
  }

  get rows(): string[] {
    return this.inputTable.rows;
  }

  get columns(): string[] {
    return this.inputTable.columns;
  }

}
