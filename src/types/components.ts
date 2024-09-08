export enum EPageType {
  area = "area",
  route = "route",
  node = "node",
}

export interface IPageHeader {
  title: string;
  itemType: EPageType;
}
