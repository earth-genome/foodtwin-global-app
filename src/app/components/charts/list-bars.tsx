import { formatKeyIndicator } from "@/utils/numbers";
import { useMemo } from "react";

interface IDataPoint {
  label: string;
  value: number;
  color?: string;
}

interface IBar extends IDataPoint {
  fraction: number;
  showPercentage?: boolean;
  unit?: string;
  formatType: "metric" | "weight";
  decimalPlaces: number;
}

interface IListBars {
  showPercentage?: boolean;
  data: IDataPoint[];
  unit?: string;
  formatType: "metric" | "weight";
  decimalPlaces?: number;
}

function Bar({
  label,
  value,
  color = "#2E6FFF",
  fraction,
  showPercentage,
  unit,
  formatType,
  decimalPlaces,
}: IBar) {
  const percent = (fraction * 100).toFixed(2);
  const formattedValue = formatKeyIndicator(value, formatType, decimalPlaces);

  return (
    <div className="mb-8">
      <div className="flex text-sm mb-1">
        <div className="flex-grow">
          <span aria-hidden="true" className="mr-2" style={{ color }}>
            &#9679;
          </span>
          <b>{label}</b>
        </div>
        <div>
          {formattedValue} {unit}
          {showPercentage && (
            <>
              <span className="text-neutral-400" aria-hidden="true">
                {" "}
                |{" "}
              </span>{" "}
              {percent}%
            </>
          )}
        </div>
      </div>
      <div className="bg-neutral-200 h-2">
        <div
          style={{ backgroundColor: color, width: `${percent}%` }}
          className="h-2"
        ></div>
      </div>
    </div>
  );
}

function ListBars({
  data,
  showPercentage,
  unit,
  formatType,
  decimalPlaces = 0,
}: IListBars) {
  const sum = useMemo(() => {
    return data.reduce((sum, { value }) => sum + value, 0);
  }, [data]);

  return (
    <>
      {data.map(({ label, value, color }) => {
        const fraction = value / sum;
        return (
          <Bar
            key={label}
            label={label}
            value={value}
            color={color}
            fraction={fraction}
            showPercentage={showPercentage}
            unit={unit}
            formatType={formatType}
            decimalPlaces={decimalPlaces}
          />
        );
      })}
    </>
  );
}

export default ListBars;
