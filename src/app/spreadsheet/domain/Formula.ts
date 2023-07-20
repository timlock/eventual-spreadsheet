import {Address} from "./Address";
import {FormulaType} from "./FormulaType";

export interface Formula {
   type: FormulaType;
   range: [Address,Address];
}

export function isFormula(object: any): object is Formula{
  return (
    typeof object === 'object' &&
    'type' in object &&
    'range' in object
  );
}
