import {Table} from "../domain/Table";
import {InputCell} from "../domain/InputCell";
import {Address} from "../domain/Address";
import {Formula, isFormula} from "../domain/Formula";
import {GraphSorter} from "../util/GraphSorter";
import {FormulaType} from "../domain/FormulaType";
import {Solvable} from "./Solvable";
import {OutputCell} from "../domain/OutputCell";


export class SpreadsheetSolver {
  private result: Table<OutputCell> | undefined;

  constructor(private readonly table: Solvable<InputCell>) {
  }

  public reset() {
    this.result = undefined;
  }

  public solve(): Table<OutputCell> {
    if (this.result === undefined) {
      this.result = new Table();
      this.table.rows.forEach(row => this.result?.addRow(row));
      this.table.columns.forEach(column => this.result?.addColumn(column));
      this.renderSimpleCells(this.table);
      const formulas = this.collectFormulas(this.table);
      this.renderFormulas(formulas, this.table);
    }
    return this.result;
  }

  private renderSimpleCells(table: Solvable<InputCell>) {
    let rowIndex = 0;
    for (const row of table.rows) {
      let columnIndex = 0;
      rowIndex++;
      for (const column of table.columns) {
        columnIndex++;
        const address: Address = {column: column, row: row};
        const cell = table.get(address);
        if (cell !== undefined && (typeof cell.content === 'number' || typeof cell.content === 'string')) {
          this.result?.set(address, {
            address: address,
            columnIndex: columnIndex,
            rowIndex: rowIndex,
            input: cell.input,
            content: cell.content
          });
        }
      }
    }
  }

  private collectFormulas(table: Solvable<InputCell>): [Address, Address[]][] {
    const formulas: [Address, Address[]][] = [];
    for (const rowId of table.rows) {
      for (const colId of table.columns) {
        const address: Address = {column: colId, row: rowId};
        const cell = table.get(address);
        if (cell !== undefined && cell.content !== undefined && isFormula(cell.content)) {
          const addressRange = table.getAddressRange(cell.content.begin, cell.content.end);
          formulas.push([{column: colId, row: rowId}, addressRange]);
        }

      }
    }
    return formulas;
  }

  private renderFormulas(formulas: [Address, Address[]][], table: Solvable<InputCell>) {
    const sorter = new GraphSorter();
    formulas.filter(formula => this.result?.get(formula[0]) === undefined).forEach(v => sorter.addCell(v));
    for (const group of sorter.sort()) {
      for (const address of group) {
        const formulaCell = table.get(address)!;
        const result = this.computeFormula(formulaCell.content as Formula);
        this.result?.set(address, {
          address: address,
          columnIndex: table.columns.indexOf(address.column),
          rowIndex: table.rows.indexOf(address.row),
          input: formulaCell.input, content: result
        });
      }
    }
  }


  private computeFormula(formula: Formula): number {
    const cells = this.result!.getCellRange(formula.begin, formula.end)
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
