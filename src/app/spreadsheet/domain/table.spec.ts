import {waitForAsync} from '@angular/core/testing';
import {Identifier} from "../../identifier/Identifier";
import {Table} from "./Table";
import {Address} from "./Address";
import {InputCell} from "./InputCell";


describe('Table', () => {
  let table: Table<InputCell>;
  let idGenerator: Identifier;

  beforeEach(waitForAsync(() => {
    idGenerator = new Identifier('test');
    let rows = [idGenerator.next(), idGenerator.next(), idGenerator.next()];
    let columns = [idGenerator.next(), idGenerator.next(), idGenerator.next()];
    table = new Table<InputCell>();
    rows.forEach(row => table.addRow(row));
    columns.forEach(column => table.addColumn(column));
  }));


  it('getCellRange', () => {
    let firstCell: InputCell = {input: 'first', content: 1};
    let secondCell: InputCell = {input: 'second', content: 2};
    let firstAddress: Address = {column: table.columns[0], row: table.rows[0]};
    let secondAddress: Address = {column: table.columns[0], row: table.rows[1]};
    let range: [Address, Address] = [firstAddress, {column: table.columns[0], row: table.rows[2]}];

    table.set(firstAddress, firstCell);
    table.set(secondAddress, secondCell);
    let result = table.getCellRange(range[0], range[1]);
    expect(result.length).toEqual(2);
    expect(result[0]).toEqual(firstCell);
    expect(result[1]).toEqual(secondCell);
  });
});
