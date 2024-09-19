import { EItemType } from "./components";

export interface ProductionArea {
  id: string;
  name: string;
}

export interface IResult {
  id: string;
  label: string;
  type: EItemType;
}
