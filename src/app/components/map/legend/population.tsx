import { formatKeyIndicator } from "../../../../utils/numbers";
interface PopulationLegendProps {
  range: [number, number];
}

function PopulationLegend({ range }: PopulationLegendProps) {
  const [min, max] = range;

  return (
    <div className="flex flex-grow items-center gap-4 p-4">
      <span className="font-bold whitespace-nowrap">Population</span>
      <div className="flex items-center gap-2 flex-grow">
        <span className="text-neutral-600 text-xs">
          {formatKeyIndicator(min, "metric", 0)}
        </span>
        <div
          className="h-4 flex-grow rounded"
          style={{
            background:
              "linear-gradient(to right, rgba(198, 14, 8, 0.3), rgba(198, 14, 8, 0.9))",
          }}
        />
        <span className="text-neutral-600 text-xs">
          {formatKeyIndicator(max, "metric", 0)}
        </span>
      </div>
    </div>
  );
}

export default PopulationLegend;
