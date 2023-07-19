import {Injectable} from '@angular/core';
import {Table} from "../../domain/Table";
import {Cell} from "../../domain/Cell";
import {CellDto} from "../../controller/CellDto";
import {CellParser} from "../../util/CellParser";
import {Address} from "../../domain/Address";
import {Formula, FormulaType} from "../../domain/Formula";
import {GraphSorter} from "../../util/GraphSorter";
import {CrdtTable} from "../domain/CrdtTable";

@Injectable({
  providedIn: 'root'
})
export class CrdtSpreadsheetService {
  private table: CrdtTable<Cell> = new CrdtTable<Cell>();
  private renderedTable: Table<Cell> | undefined;

  public constructor() {
    // let counter = 0;
    // let tag = 'init';
    // this.addRow(tag + counter++);
    // this.addRow(tag + counter++);
    // this.addRow(tag + counter++);
    // this.addColumn(tag + counter++);
    // this.addColumn(tag + counter++);
    // this.addColumn(tag + counter++);
    this.renderedTable = undefined;
  }

  public applyUpdate(update: Uint8Array) {
    this.table.applyUpdate(update);
  }


  public addRow(id: string): Uint8Array | undefined {
    let update = this.table.addRow(id);
    this.renderedTable = undefined;
    return update;
  }

  public insertRow(id: string, row: string): Uint8Array | undefined {
    let update = this.table.insertRow(id, row);
    this.renderedTable = undefined;
    if (update === undefined) {
      console.warn('Update is undefined');
    }
    return update;
  }

  public deleteRow(id: string): Uint8Array | undefined {
    let update = this.table.deleteRow(id);
    this.renderedTable = undefined;
    if (update === undefined) {
      console.warn('Update is undefined');
    }
    return update;
  }

  public addColumn(id: string): Uint8Array | undefined {
    let update = this.table.addColumn(id);
    this.renderedTable = undefined;
    if (update === undefined) {
      console.warn('Update is undefined');
    }
    return update;
  }

  public insertColumn(id: string, column: string): Uint8Array | undefined {
    let update = this.table.insertColumn(id, column);
    this.renderedTable = undefined;
    if (update === undefined) {
      console.warn('Update is undefined');
    }
    return update;
  }

  public deleteColumn(id: string): Uint8Array | undefined {
    let update = this.table.deleteColumn(id);
    this.renderedTable = undefined;
    if (update === undefined) {
      console.warn('Update is undefined');
    }
    return update;
  }

  public insertCell(cellDto: CellDto): Uint8Array | undefined {
    if (cellDto.input.trim().length === 0) {
      this.deleteCell(cellDto);
      return;
    }
    let cell = CellParser.parseCell(cellDto.input);
    let update = this.table.set(cellDto.address, cell);
    this.renderedTable = undefined;
    if (update === undefined) {
      console.warn('Update is undefined');
      return update;
    }
    return update;

  }

  public deleteCell(cellDto: CellDto): Uint8Array | undefined {
    let update = this.table.deleteValue(cellDto.column, cellDto.row);
    this.renderedTable = undefined;
    if (update === undefined) {
      console.warn('Update is undefined');
      return update;
    }
    return update;
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
        let address = new Address(colId, rowId);
        let cell = this.table.get(address)!;
        if (cell === undefined) {
          renderedTable.set(address, Cell.empty());
        } else if (typeof (cell.content) === 'number') {
          renderedTable.set(address, cell);
        }
      }
    }
  }

  private collectFormulas(table: CrdtTable<Cell>): [Address, Address[]][] {
    let formulas: [Address, Address[]][] = [];
    for (const rowId of this.rows) {
      for (const colId of this.columns) {
        let address = new Address(colId, rowId);
        let cell = table.get(address)!;
        if (cell != undefined && cell.content instanceof Formula) {
          let addressRange = this.table.getAddressRange(cell.content.range);
          formulas.push([new Address(colId, rowId), addressRange]);
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
        let result = this.computeFormula(<Formula>formulaCell.content);
        renderedTable.set(address, new Cell(formulaCell.rawInput, result));
      }
    }
  }


  private computeFormula(formula: Formula): number {
    let cells = this.renderedTable!.getCellRange(formula.range).map(c => <number>c.content);
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
    return this.getCellById(Address.of(column, row));
  }

  get rows(): string[] {
    return this.table.rows;
  }

  get columns(): string[] {
    return this.table.columns;
  }

  public getEncodedState(): Uint8Array | undefined {
    return this.table.getEncodedState();
  }
}
