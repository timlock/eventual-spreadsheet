import {Injectable} from '@angular/core';
import {CellDto} from "./CellDto";
import {CellParser} from "../util/CellParser";
import {GraphSorter} from "../util/GraphSorter";
import {emptyCell, Cell} from "../domain/Cell";
import {Formula, isFormula} from "../domain/Formula";
import {Address} from "../domain/Address";
import {Table} from "../domain/Table";
import {FormulaType} from "../domain/FormulaType";

@Injectable({
  providedIn: 'root'
})
export class SpreadsheetService {
  private table: Table<Cell> = new Table();
  private renderedTable: Table<Cell> | undefined;

  public constructor() {
    let counter = 0;
    let tag = 'init';
    this.addRow(tag + counter++);
    this.addRow(tag + counter++);
    this.addRow(tag + counter++);
    this.addColumn(tag + counter++);
    this.addColumn(tag + counter++);
    this.addColumn(tag + counter++);
    this.renderedTable = undefined;
  }


  public addRow(id: string) {
    this.table.addRow(id);
    this.renderedTable = undefined;
  }

  public insertRow(id: string, row: string) {
    this.table.insertRow(id, row);
    this.renderedTable = undefined;
  }

  public deleteRow(id: string) {
    this.table.deleteRow(id);
    this.renderedTable = undefined;
  }

  public addColumn(id: string) {
    this.table.addColumn(id);
    this.renderedTable = undefined;
  }

  public insertColumn(id: string, column: string) {
    this.table.insertColumn(id, column);
    this.renderedTable = undefined;
  }

  public deleteColumn(id: string) {
    this.table.deleteColumn(id);
    this.renderedTable = undefined;
  }

  public insertCell(cellDto: CellDto) {
    if (cellDto.input.trim().length === 0) {
      this.deleteCell(cellDto);
    } else {
      let cell = CellParser.parseCell(cellDto.input);
      this.table.set(cellDto.address, cell);
    }
    this.renderedTable = undefined;
  }

  public deleteCell(cellDto: CellDto) {
    this.table.deleteValue(cellDto.column, cellDto.row);
    this.renderedTable = undefined;
  }

  public renderTable(): Table<Cell> {
    if (this.renderedTable === undefined) {
      this.renderedTable = new Table<Cell>();
      this.rows.forEach(row => this.renderedTable?.addRow(row));
      this.columns.forEach(column => this.renderedTable?.addColumn(column));
      this.renderSimpleCells(this.renderedTable);
      let formulas = this.collectFormulas(this.table);
      this.renderFormulas(formulas, this.renderedTable);
      console.log('Table rendered');
    }
    return this.renderedTable;
  }

  private renderSimpleCells(renderedTable: Table<Cell>) {
    for (const rowId of this.rows) {
      for (const colId of this.columns) {
        let address: Address = {column: colId, row: rowId};
        let cell = this.table.get(address)!;
        if (cell === undefined) {
          renderedTable.set(address, emptyCell());
        } else if (typeof cell.content === 'number' || typeof cell.content === 'string') {
          renderedTable.set(address, cell);
        }
      }
    }
  }

  private collectFormulas(table: Table<Cell>): [Address, Address[]][] {
    let formulas: [Address, Address[]][] = [];
    for (const rowId of this.rows) {
      for (const colId of this.columns) {
        let address: Address = {column: colId, row: rowId};
        let cell = table.get(address)!;
        if (cell != undefined && cell.content !== undefined && isFormula(cell.content)) {
          let addressRange = this.table.getAddressRange(cell.content.range);
          formulas.push([{column: colId, row: rowId}, addressRange]);
        }
      }
    }
    return formulas;
  }

  private renderFormulas(formulas: [Address, Address[]][], renderedTable: Table<Cell>) {
    let sorter = new GraphSorter();
    formulas.filter(formula => this.renderedTable?.get(formula[0]) === undefined).forEach(v => sorter.addCell(v));
    for (const group of sorter.sort()) {
      for (const address of group) {
        let formulaCell = this.table.get(address)!;
        let result = this.computeFormula(formulaCell.content as Formula);
        renderedTable.set(address, {rawInput: formulaCell.rawInput, content: result});
      }
    }
  }


  private computeFormula(formula: Formula): number {
    let cells = this.renderedTable!.getCellRange(formula.range)
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

  public getCellById(address: Address): CellDto {
    let cell = this.renderedTable?.get(address);
    if (cell === undefined) {
      return new CellDto(address, '');
    }
    return new CellDto(address, cell.rawInput);
  }

  public getCellByIndex(columnIndex: number, rowIndex: number): CellDto {
    let column = this.columns[columnIndex];
    let row = this.rows[rowIndex];
    return this.getCellById({column: column, row: row});
  }

  get rows(): string[] {
    return this.table.rows;
  }

  get columns(): string[] {
    return this.table.columns;
  }
}
