import { BBox } from "geojson";
import { MapGeoJSONFeature, MapRef } from "react-map-gl/maplibre";
import { IMapPopup } from "@/app/components/map-popup";

interface ActionInitContext {
  type: "action:initializeContext";
  context: {
    areaId: string | null;
  };
}

interface ActionSetMapRef {
  type: "action:setMapRef";
  mapRef: MapRef;
}

interface ActionSetHighlightedArea {
  type: "action:setHighlightedArea";
  highlightedArea: MapGeoJSONFeature | null;
  MapPopup: IMapPopup | null;
}

interface ActionAreaSelect {
  type: "action:area:select";
  areaId: string;
  mapBounds: BBox | null;
}
interface ActionAreaClear {
  type: "action:area:clear";
}

export type StateActions =
  | ActionInitContext
  | ActionSetMapRef
  | ActionSetHighlightedArea
  | ActionAreaSelect
  | ActionAreaSelect
  | ActionAreaClear;
