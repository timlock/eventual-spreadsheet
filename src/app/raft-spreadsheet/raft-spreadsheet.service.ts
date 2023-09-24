import {Injectable} from '@angular/core';
import {Table} from "../spreadsheet/domain/Table";
import {InputCell} from "../spreadsheet/domain/InputCell";
import {SpreadsheetSolver} from "../spreadsheet/controller/SpreadsheetSolver";
import {Identifier} from "../identifier/Identifier";
import {Action} from "../spreadsheet/util/Action";
import {PayloadFactory} from "../spreadsheet/util/PayloadFactory";
import {Address} from "../spreadsheet/domain/Address";
import {CellParser} from "../spreadsheet/util/CellParser";
import {ActionType} from "../spreadsheet/util/ActionType";
import {OutputCell} from "../spreadsheet/domain/OutputCell";
import {Spreadsheet} from "../test-environment/Spreadsheet";

@Injectable({
  providedIn: 'root'
})
export class RaftSpreadsheetService implements Spreadsheet<Action> {
  private inputTable: Table<InputCell> = new Table();
  private spreadsheetSolver: SpreadsheetSolver = new SpreadsheetSolver(this.inputTable);

  public constructor() {
    this.fillTable();
  }

  private fillTable() {
    const counter = new Identifier('init')
    for (let i = 0; i < 10; i++) {
      const addRow = this.addRow(counter.next());
      const addColumn = this.addColumn(counter.next());
      this.applyUpdate(addRow);
      this.applyUpdate(addColumn);
    }
    this.spreadsheetSolver.reset();
  }


  public addRow(id: string): Action {
    return PayloadFactory.addRow(id);
  }

  public insertRow(id: string, row: string): Action {
    return PayloadFactory.insertRow(id, row);
  }

  public deleteRow(id: string): Action {
    return PayloadFactory.deleteRow(id);
  }

  public addColumn(id: string): Action {
    return PayloadFactory.addColumn(id);
  }

  public insertColumn(id: string, column: string): Action {
    return PayloadFactory.insertColumn(id, column);
  }

  public deleteColumn(id: string): Action {
    return PayloadFactory.deleteColumn(id);
  }

  public set(address: Address, input: string): Action {
    return PayloadFactory.insertCell(address, input);
  }

  private deleteCell(address: Address) {
    this.inputTable.deleteValue(address);
    this.spreadsheetSolver.reset();
  }

  public applyUpdate(update: Action) {
    switch (update.action) {
      case ActionType.INSERT_CELL: {
        const address: Address = {column: update.column!, row: update.row!};
        if (update.input!.trim().length === 0) {
          this.deleteCell(address);
        } else {
          const cell = CellParser.parseCell(update.input!);
          this.inputTable.set(address, cell);
        }
        this.spreadsheetSolver.reset();
      }
        break;
      case ActionType.ADD_ROW: {
        this.inputTable.addRow(update.input!);
        this.spreadsheetSolver.reset();
      }
        break;
      case ActionType.INSERT_ROW: {
        this.inputTable.insertRow(update.input!, update.row!);
        this.spreadsheetSolver.reset();
      }
        break;
      case ActionType.ADD_COLUMN: {
        this.inputTable.addColumn(update.input!);
        this.spreadsheetSolver.reset();
      }
        break;
      case ActionType.INSERT_COLUMN: {
        this.inputTable.insertColumn(update.input!, update.column!);
        this.spreadsheetSolver.reset();
      }
        break;
      case ActionType.DELETE_COLUMN: {
        this.inputTable.deleteColumn(update.column!);
        this.spreadsheetSolver.reset();
      }
        break;
      case ActionType.DELETE_ROW: {
        this.inputTable.deleteRow(update.row!);
        this.spreadsheetSolver.reset();
      }
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
