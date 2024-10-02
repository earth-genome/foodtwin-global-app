import { EItemType } from "./components";

export interface ProductionArea {
  id: string;
  name: string;
}

export interface IResult {
  id: string;
  name: string;
  type: EItemType;
}
