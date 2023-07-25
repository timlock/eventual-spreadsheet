import {Table} from "../domain/Table";
import {Cell, emptyCell} from "../domain/Cell";
import {Address} from "../domain/Address";
import {Formula, isFormula} from "../domain/Formula";
import {GraphSorter} from "../util/GraphSorter";
import {FormulaType} from "../domain/FormulaType";
import {Spreadsheet} from "./Spreadsheet";


export class SpreadsheetSolver {
  private result: Table<Cell> | undefined;
  private readonly table: Spreadsheet<Cell>;

  constructor(table: Spreadsheet<Cell>) {
    this.table = table;
  }

  public reset() {
    this.result = undefined;
  }

  public solve(): Table<Cell> {
    if(this.result === undefined) {
      this.result = new Table<Cell>();
      this.table.rows.forEach(row => this.result?.addRow(row));
      this.table.columns.forEach(column => this.result?.addColumn(column));
      this.renderSimpleCells(this.table);
      let formulas = this.collectFormulas(this.table);
      this.renderFormulas(formulas, this.table);
      console.log('Table rendered');
    }
    return this.result;
  }

  private renderSimpleCells(table: Spreadsheet<Cell>) {
    for (const rowId of table.rows) {
      for (const colId of table.columns) {
        let address: Address = {column: colId, row: rowId};
        let cell = table.get(address);
        if (cell === undefined) {
          this.result?.set(address, emptyCell());
        } else if (typeof cell.content === 'number' || typeof cell.content === 'string') {
          this.result?.set(address, cell);
        }
      }
    }
  }

  private collectFormulas(table: Spreadsheet<Cell>): [Address, Address[]][] {
    let formulas: [Address, Address[]][] = [];
    for (const rowId of table.rows) {
      for (const colId of table.columns) {
        let address: Address = {column: colId, row: rowId};
        let cell = table.get(address);
        if (cell !== undefined && cell.content !== undefined && isFormula(cell.content)) {
          let addressRange = table.getAddressRange(cell.content.range);
          formulas.push([{column: colId, row: rowId}, addressRange]);
        }

      }
    }
    return formulas;
  }

  private renderFormulas(formulas: [Address, Address[]][], table: Spreadsheet<Cell>) {
    let sorter = new GraphSorter();
    formulas.filter(formula => this.result?.get(formula[0]) === undefined).forEach(v => sorter.addCell(v));
    for (const group of sorter.sort()) {
      for (const address of group) {
        let formulaCell = table.get(address)!;
        let result = this.computeFormula(formulaCell.content as Formula);
        this.result?.set(address, {rawInput: formulaCell.rawInput, content: result});
      }
    }
  }


  private computeFormula(formula: Formula): number {
    let cells = this.result!.getCellRange(formula.range)
      .map(c => c.content)
      .filter(cell => typeof cell === 'number')
      .map(cell => cell as number);
    switch (formula.type) {
      case FormulaType.SUM:
        return cells.length != 0 ? cells.reduce((acc, i) => acc + i) : 0;
      case FormulaType.MAX:
        return Math.max.apply(null, cells);
      case FormulaType.MIN:
        return Math.min.apply(null, cells);
    }
  }
}
