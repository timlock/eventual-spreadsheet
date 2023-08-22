import {Address} from "./Address";
import {FormulaType} from "./FormulaType";

export interface Formula {
  type: FormulaType;
  begin: Address;
  end: Address;
}

export function isFormula(object: any): object is Formula {
  return (
    typeof object === 'object' &&
    'type' in object &&
    'begin' in object &&
    'end' in object
  );
}
