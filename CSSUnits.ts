type suffixes = 
| "px" 
| "%" 
| "vh" 
| "vw";

export type CSSUnitsInput = undefined | number | CSSUnits;

export const toCSSUnits = (input: CSSUnitsInput): CSSUnits => {
  if (typeof(input) === "undefined") return "0px";
  if (typeof(input) === "number") return `${input}px`;
  return input;
};

export type CSSUnits = "0" | `${number}${suffixes}`;