import { EItemType } from "@/types/components";
import Area from "./area";
import Node from "./node";
import Route from "./route";

export function getTypeIcon(itemType: EItemType) {
  switch (itemType) {
    case EItemType.route:
      return <Route />;
    case EItemType.area:
      return <Area />;
    case EItemType.node:
      return <Node />;
  }
}

interface ITypeIcon {
  itemType: EItemType;
}

function TypeIcon({ itemType }: ITypeIcon) {
  return getTypeIcon(itemType);
}

export default TypeIcon;
