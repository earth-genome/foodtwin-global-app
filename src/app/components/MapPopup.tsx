import { Popup } from "react-map-gl";
import { EPageType } from "@/types/components";

import { getTypeIcon } from "./icons/getTypeIcon";
import "./css/popup.css";

interface IMapPopup {
  id: string;
  label: string;
  itemType: EPageType;
  longitude: number;
  latitude: number;
}

function MapPopup({ id, label, itemType, longitude, latitude }: IMapPopup) {
  return (
    <Popup
      key={id}
      anchor="bottom"
      longitude={longitude}
      latitude={latitude}
      maxWidth="250px"
      closeButton={false}
      offset={12}
    >
      <div className="flex gap-2 items-center font-header tracking-tighter text-white bg-neutral-800 p-2 rounded">
        {getTypeIcon(itemType)}
        <span>{label}</span>
      </div>
    </Popup>
  );
}

export default MapPopup;
