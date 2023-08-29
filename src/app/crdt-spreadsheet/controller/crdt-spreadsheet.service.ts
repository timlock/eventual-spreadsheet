import {Injectable} from '@angular/core';
import {OutputCell} from "../../spreadsheet/domain/OutputCell";
import {CellParser} from "../../spreadsheet/util/CellParser";
import {CrdtTable} from "../domain/CrdtTable";
import {InputCell} from "../../spreadsheet/domain/InputCell";
import {Address} from "../../spreadsheet/domain/Address";
import {Table} from "../../spreadsheet/domain/Table";
import {SpreadsheetSolver} from "../../spreadsheet/controller/SpreadsheetSolver";

@Injectable({
    providedIn: 'root'
})
export class CrdtSpreadsheetService {
    private table: CrdtTable<InputCell> = new CrdtTable();
    private spreadsheetSolver = new SpreadsheetSolver(this.table);

    public applyUpdate(update: Uint8Array) {
        this.table.applyUpdate(update);
        this.spreadsheetSolver.reset();
    }


    public addRow(id: string): Uint8Array | undefined {
        const update = this.table.addRow(id);
        this.spreadsheetSolver.reset();
        return update;
    }

    public insertRow(id: string, row: string): Uint8Array | undefined {
        const update = this.table.insertRow(id, row);
        this.spreadsheetSolver.reset();
        if (update === undefined) {
            console.warn('Update is undefined');
        }
        return update;
    }

    public deleteRow(id: string): Uint8Array | undefined {
        const update = this.table.deleteRow(id);
        this.spreadsheetSolver.reset();
        if (update === undefined) {
            console.warn('Update is undefined');
        }
        return update;
    }

    public addColumn(id: string): Uint8Array | undefined {
        const update = this.table.addColumn(id);
        this.spreadsheetSolver.reset();
        if (update === undefined) {
            console.warn('Update is undefined');
        }
        return update;
    }

    public insertColumn(id: string, column: string): Uint8Array | undefined {
        const update = this.table.insertColumn(id, column);
        this.spreadsheetSolver.reset();
        if (update === undefined) {
            console.warn('Update is undefined');
        }
        return update;
    }

    public deleteColumn(id: string): Uint8Array | undefined {
        const update = this.table.deleteColumn(id);
        this.spreadsheetSolver.reset();
        if (update === undefined) {
            console.warn('Update is undefined');
        }
        return update;
    }

    public insertCellById(address: Address, input: string): Uint8Array | undefined {
        if (input.trim().length === 0) {
            return this.deleteCell(address);
        }
        const cell = CellParser.parseCell(input);
        const update = this.table.set(address, cell);
        this.spreadsheetSolver.reset();
        if (update === undefined) {
            console.warn('Update is undefined');
            return update;
        }
        return update;

    }

    public deleteCell(address: Address): Uint8Array | undefined {
        const update = this.table.deleteValue(address);
        this.spreadsheetSolver.reset();
        if (update === undefined) {
            console.warn('Update is undefined');
            return update;
        }
        return update;
    }

    public getTable(): Table<OutputCell> {
        return this.spreadsheetSolver.solve();
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
