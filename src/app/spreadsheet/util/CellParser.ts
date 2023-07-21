import {Cell} from "../domain/Cell";
import {Formula} from "../domain/Formula";
import {Address} from "../domain/Address";
import {FormulaType} from "../domain/FormulaType";

export class CellParser {

  public static parseCell(rawInput: string): Cell {
    let value = +rawInput;
    if (!Number.isNaN(value)) {
      return {rawInput: rawInput, content: value}
    }
    let formula = this.parseFormula(rawInput);
    if (formula !== undefined) {
      return {rawInput: rawInput, content: formula}
    }
    return {rawInput: rawInput, content: rawInput}
  }

  private static parseFormula(rawInput: string): Formula | undefined {
    if (!rawInput.includes('=') || !rawInput.includes('(') || !rawInput.includes(')')) {
      return undefined;
    }
    let trimmed = rawInput.trim();
    let typeString = trimmed.substring(1, trimmed.indexOf('('));
    let formulaType = FormulaType[typeString as keyof typeof FormulaType];
    let rangeStr = trimmed.substring(trimmed.indexOf('(') + 1, trimmed.indexOf(')'));
    let range = this.parseRange(rangeStr);
    if (range === undefined) {
      return undefined;
    }
    return {type: formulaType, range: range}
  }

  public static parseRange(addrStr: string): [Address, Address] | undefined {
    let addrPair = addrStr.split(':');
    if (addrPair.length != 2) {
      return undefined;
    }
    let first = this.parse(addrPair[0]);
    let second = this.parse(addrPair[1]);
    if (first == undefined || second == undefined) {
      return undefined;
    }
    return [first, second];
  }

  public static parse(input: string): Address | undefined {
    let addressStr = input.split('|');
    if (addressStr.length != 2) {
      return undefined;
    }
    return {column: addressStr[0], row: addressStr[1]}
  }

}
