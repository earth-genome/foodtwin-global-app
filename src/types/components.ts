export enum EItemType {
  area = "area",
  route = "route",
  node = "node",
}

export interface IPageHeader {
  title: string;
  itemType: EItemType;
}
