import {Injectable} from '@angular/core';
import {OutputCell} from "../../spreadsheet/domain/OutputCell";
import {CellParser} from "../../spreadsheet/util/CellParser";
import {CrdtTable} from "../domain/CrdtTable";
import {InputCell} from "../../spreadsheet/domain/InputCell";
import {Address} from "../../spreadsheet/domain/Address";
import {Table} from "../../spreadsheet/domain/Table";
import {SpreadsheetSolver} from "../../spreadsheet/controller/SpreadsheetSolver";
import {Spreadsheet} from "../../test-environment/Spreadsheet";
import {CrdtTableNoKeep} from "../domain/CrdtTableNoKeep";

@Injectable({
    providedIn: 'root'
})
export class CrdtSpreadsheetService implements Spreadsheet<Uint8Array>{
    private inputTable: CrdtTable<InputCell> = new CrdtTable();
    // private inputTable: CrdtTableNoKeep<InputCell> = new CrdtTableNoKeep();
    private spreadsheetSolver = new SpreadsheetSolver(this.inputTable);

    public applyUpdate(update: Uint8Array) {
        this.inputTable.applyUpdate(update);
        this.spreadsheetSolver.reset();
    }


    public addRow(id: string): Uint8Array | undefined {
        const update = this.inputTable.addRow(id);
        this.spreadsheetSolver.reset();
        return update;
    }

    public insertRow(id: string, row: string): Uint8Array | undefined {
        const update = this.inputTable.insertRow(id, row);
        this.spreadsheetSolver.reset();
        if (update === undefined) {
            console.warn('Update is undefined');
        }
        return update;
    }

    public deleteRow(id: string): Uint8Array | undefined {
        const update = this.inputTable.deleteRow(id);
        this.spreadsheetSolver.reset();
        if (update === undefined) {
            console.warn('Update is undefined');
        }
        return update;
    }

    public addColumn(id: string): Uint8Array | undefined {
        const update = this.inputTable.addColumn(id);
        this.spreadsheetSolver.reset();
        if (update === undefined) {
            console.warn('Update is undefined');
        }
        return update;
    }

    public insertColumn(id: string, column: string): Uint8Array | undefined {
        const update = this.inputTable.insertColumn(id, column);
        this.spreadsheetSolver.reset();
        if (update === undefined) {
            console.warn('Update is undefined');
        }
        return update;
    }

    public deleteColumn(id: string): Uint8Array | undefined {
        const update = this.inputTable.deleteColumn(id);
        this.spreadsheetSolver.reset();
        if (update === undefined) {
            console.warn('Update is undefined');
        }
        return update;
    }

    public set(address: Address, input: string): Uint8Array | undefined {
        if (input.trim().length === 0) {
            return this.deleteCell(address);
        }
        const cell = CellParser.parseCell(input);
        const update = this.inputTable.set(address, cell);
        this.spreadsheetSolver.reset();
        if (update === undefined) {
            console.warn('Update is undefined');
            return update;
        }
        return update;

    }

    public deleteCell(address: Address): Uint8Array | undefined {
        const update = this.inputTable.deleteValue(address);
        this.spreadsheetSolver.reset();
        if (update === undefined) {
            console.warn('Update is undefined');
            return update;
        }
        return update;
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

    public getEncodedState(encodedStateVector?: Uint8Array): Uint8Array | undefined {
        return this.inputTable.encodeStateAsUpdate(encodedStateVector);
    }
}
