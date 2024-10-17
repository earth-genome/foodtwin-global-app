import { ArrowDown, ArrowUp } from "@phosphor-icons/react";
import { useState } from "react";

interface ILegendItem {
  color: string;
  label: string;
}

function LegendItem({ color, label }: ILegendItem) {
  return (
    <div className="flex gap-2 items-center">
      <span className={`w-2 h-2 bg-${color} rounded`} />
      <span>{label}</span>
    </div>
  );
}

function Legend() {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

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
        <div className="p-4 border-r border-neutral-300 flex-grow">
          <h3 className="mb-2 font-bold">Categories</h3>
          <div className="grid grid-cols-2 gap-x-8 gap-y-2">
            <LegendItem color="food-dairy-and-eggs" label="Dairy and Eggs" />
            <LegendItem
              color="food-oils-and-oilseeds"
              label="Oils and Oilseed"
            />
            <LegendItem color="food-starches" label="Starches" />
            <LegendItem color="food-fruits" label="Fruits" />
            <LegendItem color="food-grains" label="Grains" />
            <LegendItem color="food-pulses" label="Pulses" />
            <LegendItem color="food-vegetables" label="Vegetables" />
            <LegendItem color="food-treenuts" label="Treenuts" />
            <LegendItem color="food-meat-and-fish" label="Meet and Fish" />
            <LegendItem color="food-other" label="Other" />
          </div>
        </div>
        <div className="p-4 flex-grow">
          <h3 className="mb-2 font-bold">Calories production</h3>
          <div className="flex gap-4 items-center">
            <span>Low</span>
            <span className="border border-neutral-400 w-[4px] h-[4px] rounded-[2px]" />
            <span className="border border-neutral-400 w-[8px] h-[8px] rounded-[4px]" />
            <span className="border border-neutral-400 w-[12px] h-[12px] rounded-[6px]" />
            <span className="border border-neutral-400 w-[16px] h-[16px] rounded-[8px]" />
            <span className="border border-neutral-400 w-[20px] h-[20px] rounded-[10px]" />
            <span>High</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Legend;
