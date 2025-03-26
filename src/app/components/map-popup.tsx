import { Popup } from "react-map-gl";
import { EItemType } from "@/types/components";

import TypeIcon from "./icons/type-icon";
import "./css/popup.css";

export interface IMapPopup {
  id: string;
  label: string;
  itemType: EItemType;
  longitude: number;
  latitude: number;
  colorScheme?: "light" | "dark";
}

function MapPopup({
  id,
  label,
  itemType,
  longitude,
  latitude,
  colorScheme = "light",
}: IMapPopup) {
  const colorClasses =
    colorScheme === "light"
      ? "bg-white text-neutral-800"
      : "bg-neutral-800 text-white";

  return (
    <Popup
      key={id}
      anchor="bottom"
      longitude={longitude}
      latitude={latitude}
      maxWidth="250px"
      closeButton={false}
      offset={12}
      style={{ zIndex: 10 }}
    >
      <div
        className={`flex gap-2 items-center font-header tracking-tighter ${colorClasses} p-2 rounded`}
      >
        <TypeIcon itemType={itemType} />
        <span>{label}</span>
      </div>
    </Popup>
  );
}

export default MapPopup;
