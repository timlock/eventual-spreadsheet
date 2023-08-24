import {Cell} from "../domain/Cell";
import {Formula} from "../domain/Formula";
import {Address} from "../domain/Address";
import {FormulaType} from "../domain/FormulaType";

export class CellParser {

  public static parseCell(rawInput: string): Cell {
    const value = +rawInput;
    if (!Number.isNaN(value)) {
      return {rawInput: rawInput, content: value}
    }
    const formula = this.parseFormula(rawInput);
    if (formula !== undefined) {
      return {rawInput: rawInput, content: formula}
    }
    return {rawInput: rawInput, content: rawInput}
  }

  private static parseFormula(rawInput: string): Formula | undefined {
    if (!rawInput.includes('=') || !rawInput.includes('(') || !rawInput.includes(')')) {
      return undefined;
    }
    const trimmed = rawInput.trim();
    const typeString = trimmed.substring(1, trimmed.indexOf('('));
    const formulaType = FormulaType[typeString as keyof typeof FormulaType];
    const rangeStr = trimmed.substring(trimmed.indexOf('(') + 1, trimmed.indexOf(')'));
    const range = this.parseRange(rangeStr);
    if (range === undefined) {
      return undefined;
    }
    return {type: formulaType, begin: range[0], end: range[1]}
  }

  public static parseRange(addrStr: string): [Address, Address] | undefined {
    const addrPair = addrStr.split(':');
    if (addrPair.length != 2) {
      return undefined;
    }
    const first = this.parse(addrPair[0]);
    const second = this.parse(addrPair[1]);
    if (first === undefined || second === undefined) {
      return undefined;
    }
    return [first, second];
  }

  public static parse(input: string): Address | undefined {
    const addressStr = input.split('|');
    if (addressStr.length != 2) {
      return undefined;
    }
    return {column: addressStr[0], row: addressStr[1]}
  }

}
