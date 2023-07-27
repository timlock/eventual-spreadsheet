import {Injectable} from '@angular/core';
import {CellDto} from "../../spreadsheet/controller/CellDto";
import {CellParser} from "../../spreadsheet/util/CellParser";
import {CrdtTable} from "../domain/CrdtTable";
import {Cell} from "../../spreadsheet/domain/Cell";
import {Address} from "../../spreadsheet/domain/Address";
import {Table} from "../../spreadsheet/domain/Table";
import {SpreadsheetSolver} from "../../spreadsheet/controller/SpreadsheetSolver";

@Injectable({
  providedIn: 'root'
})
export class CrdtSpreadsheetService {
  private table: CrdtTable<Cell> = new CrdtTable();
  private spreadsheetSolver = new SpreadsheetSolver(this.table);

  public applyUpdate(update: Uint8Array) {
    this.table.applyUpdate(update);
    this.spreadsheetSolver.reset();
  }


  public addRow(id: string): Uint8Array | undefined {
    let update = this.table.addRow(id);
    this.spreadsheetSolver.reset();
    return update;
  }

  public insertRow(id: string, row: string): Uint8Array | undefined {
    let update = this.table.insertRow(id, row);
    this.spreadsheetSolver.reset();
    if (update === undefined) {
      console.warn('Update is undefined');
    }
    return update;
  }

  public deleteRow(id: string): Uint8Array | undefined {
    let update = this.table.deleteRow(id);
    this.spreadsheetSolver.reset();
    if (update === undefined) {
      console.warn('Update is undefined');
    }
    return update;
  }

  public addColumn(id: string): Uint8Array | undefined {
    let update = this.table.addColumn(id);
    this.spreadsheetSolver.reset();
    if (update === undefined) {
      console.warn('Update is undefined');
    }
    return update;
  }

  public insertColumn(id: string, column: string): Uint8Array | undefined {
    let update = this.table.insertColumn(id, column);
    this.spreadsheetSolver.reset();
    if (update === undefined) {
      console.warn('Update is undefined');
    }
    return update;
  }

  public deleteColumn(id: string): Uint8Array | undefined {
    let update = this.table.deleteColumn(id);
    this.spreadsheetSolver.reset();
    if (update === undefined) {
      console.warn('Update is undefined');
    }
    return update;
  }

  public insertCell(cellDto: CellDto): Uint8Array | undefined {
    if (cellDto.input.trim().length === 0) {
      return this.deleteCell(cellDto);
    }
    let cell = CellParser.parseCell(cellDto.input);
    let update = this.table.set(cellDto.address, cell);
    this.spreadsheetSolver.reset();
    if (update === undefined) {
      console.warn('Update is undefined');
      return update;
    }
    return update;

  }

  public deleteCell(cellDto: CellDto): Uint8Array | undefined {
    let update = this.table.deleteValue(cellDto.column, cellDto.row);
    this.spreadsheetSolver.reset();
    if (update === undefined) {
      console.warn('Update is undefined');
      return update;
    }
    return update;
  }

  public getTable(): Table<Cell> {
    return this.spreadsheetSolver.solve();
  }

  // public renderTable(): Table<Cell> {
  //   if (this.renderedTable === undefined) {
  //     this.renderedTable = new Table<Cell>();
  //     this.rows.forEach(row => this.renderedTable?.addRow(row));
  //     this.columns.forEach(column => this.renderedTable?.addColumn(column));
  //     this.renderSimpleCells(this.renderedTable);
  //     let formulas = this.collectFormulas(this.table);
  //     this.renderFormulas(formulas, this.renderedTable);
  //     console.log('Table rendered');
  //   }
  //   return this.renderedTable;
  // }
  //
  // private renderSimpleCells(renderedTable: Table<Cell>) {
  //   for (const rowId of this.rows) {
  //     for (const colId of this.columns) {
  //       let address: Address = {column: colId, row: rowId};
  //       let cell = this.table.get(address);
  //       if (cell === undefined) {
  //         renderedTable.set(address, emptyCell());
  //       } else if (typeof cell.content === 'number' || typeof cell.content === 'string') {
  //         renderedTable.set(address, cell);
  //       }
  //     }
  //   }
  // }
  //
  // private collectFormulas(table: CrdtTable<Cell>): [Address, Address[]][] {
  //   let formulas: [Address, Address[]][] = [];
  //   for (const rowId of this.rows) {
  //     for (const colId of this.columns) {
  //       let address: Address = {column: colId, row: rowId};
  //       let cell = table.get(address);
  //       if (cell !== undefined && cell.content !== undefined && isFormula(cell.content)) {
  //         let addressRange = this.table.getAddressRange(cell.content.range);
  //         formulas.push([{column: colId, row: rowId}, addressRange]);
  //       }
  //
  //     }
  //   }
  //   return formulas;
  // }
  //
  // private renderFormulas(formulas: [Address, Address[]][], renderedTable: Table<Cell>) {
  //   let sorter = new GraphSorter();
  //   formulas.filter(formula => this.renderedTable?.get(formula[0]) === undefined).forEach(v => sorter.addCell(v));
  //   for (const group of sorter.sort()) {
  //     for (const address of group) {
  //       let formulaCell = this.table.get(address)!;
  //       let result = this.computeFormula(formulaCell.content as Formula);
  //       renderedTable.set(address, {rawInput: formulaCell.rawInput, content: result});
  //     }
  //   }
  // }
  //
  //
  // private computeFormula(formula: Formula): number {
  //   // let cells = this.renderedTable!.getCellRange(formula.range).map(c => <number>c.content);
  //   let cells = this.renderedTable!.getCellRange(formula.range)
  //     .map(c => c.content)
  //     .filter(cell => typeof cell === 'number')
  //     .map(cell => cell as number);
  //   switch (formula.type) {
  //     case FormulaType.SUM:
  //       return cells.length != 0 ? cells.reduce((acc, i) => acc + i) : 0;
  //     case FormulaType.MAX:
  //       return Math.max.apply(null, cells);
  //     case FormulaType.MIN:
  //       return Math.min.apply(null, cells);
  //   }
  // }

  public getCellById(address: Address): CellDto {
    let cell = this.getTable().get(address);
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

  public getEncodedState(encodedStateVector?: Uint8Array): Uint8Array | undefined {
    return this.table.encodeStateAsUpdate(encodedStateVector);
  }
}
