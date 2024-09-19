import { Popup } from "react-map-gl";
import { EItemType } from "@/types/components";

import TypeIcon from "./icons/type-icon";
import "./css/popup.css";

interface IMapPopup {
  id: string;
  label: string;
  itemType: EItemType;
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
        <TypeIcon itemType={itemType} />
        <span>{label}</span>
      </div>
    </Popup>
  );
}

export default MapPopup;
