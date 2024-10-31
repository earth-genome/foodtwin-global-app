import { ArrowDown, ArrowUp } from "@phosphor-icons/react";
import { useState } from "react";
import CategoriesLegend from "./categories";
import PopulationLegend from "./population";
import { MachineContext } from "../state";

export type Legend =
  | {
      type: "category";
    }
  | {
      type: "population";
      range: [number, number];
    };

function Legend() {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const legend = MachineContext.useSelector((state) => state.context.legend);

  if (!legend) {
    return null;
  }

  return (
    <div
      className={`absolute left-1/2 translate-x-[-50%] bottom-4 z-50 bg-neutral-100/60 rounded text-xs backdrop-blur w-[530px]`}
    >
      <button
        className={`flex gap-4 items-center px-4 py-2 w-[100%] bg-neutral-200/80 font-header text-xxs uppercase ${isExpanded ? "rounded-t" : "rounded"}`}
        onClick={() => setIsExpanded((prev) => !prev)}
        aria-controls="legend-panel"
        aria-expanded={isExpanded}
      >
        <span className="flex-grow text-left">Legend</span>
        <span aria-label={`${isExpanded ? "Collapse" : "Expand"}`}>
          {isExpanded ? <ArrowDown size={16} /> : <ArrowUp size={16} />}
        </span>
      </button>
      <div
        id="legend-panel"
        className={`flex text-neutral-600 items-center ${isExpanded ? "block" : "hidden"}`}
      >
        {legend.type === "category" && <CategoriesLegend />}
        {legend.type === "population" && (
          <PopulationLegend range={legend.range} />
        )}
      </div>
    </div>
  );
}

export default Legend;
