import {waitForAsync} from '@angular/core/testing';
import {Cell} from "./Cell";
import {Table} from "./Table";
import {Identifier} from "../../Identifier";
import {Address} from "./Address";


describe('Table', () => {
  let table: Table<Cell>;
  let idGenerator: Identifier;

  beforeEach(waitForAsync(() => {
    idGenerator = new Identifier('test');
    let row = [idGenerator.next(), idGenerator.next(), idGenerator.next()];
    let column = [idGenerator.next(), idGenerator.next(), idGenerator.next()];
    table = new Table<Cell>(row, column);
  }));


  it('getCellRange', () => {
    let firstCell = new Cell('first');
    let secondCell = new Cell('second');
    let firstAddress = new Address(table.columns[0], table.rows[0]);
    let secondAddress = new Address(table.columns[0], table.rows[1]);
    let range: [Address, Address] = [firstAddress, Address.of(table.columns[0], table.rows[2])];

    table.set(firstAddress, firstCell);
    table.set(secondAddress, secondCell);
    let result = table.getCellRange(range);
    expect(result.length).toEqual(2);
    expect(result[0]).toEqual(firstCell);
    expect(result[1]).toEqual(secondCell);
  });
});
