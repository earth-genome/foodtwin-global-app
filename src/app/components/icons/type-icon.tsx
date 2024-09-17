import { EPageType } from "@/types/components";
import Area from "./area";
import Node from "./node";
import Route from "./route";

function getTypeIcon(itemType: EPageType) {
  switch (itemType) {
    case EPageType.route:
      return <Route />;
    case EPageType.area:
      return <Area />;
    case EPageType.node:
      return <Node />;
  }
}

interface ITypeIcon {
  itemType: EPageType;
}

function TypeIcon({ itemType }: ITypeIcon) {
  return getTypeIcon(itemType);
}

export default TypeIcon;
