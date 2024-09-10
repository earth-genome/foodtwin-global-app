import { EPageType } from "@/types/components";
import Area from "./Area";
import Node from "./Node";
import Route from "./Route";

export function getTypeIcon(itemType: EPageType) {
  switch (itemType) {
    case EPageType.route:
      return <Route />;
    case EPageType.area:
      return <Area />;
    case EPageType.node:
      return <Node />;
  }
}
