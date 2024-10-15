import React from "react";
import { formatKeyIndicator } from "@/utils/numbers";

interface MetricRowProps {
  children: React.ReactNode;
}

export const MetricRow: React.FC<MetricRowProps> = ({ children }) => {
  return (
    <div className="flex justify-center items-stretch my-8">{children}</div>
  );
};

interface MetricProps {
  label: string;
  value?: number;
  unit?: string;
  formatType: "metric" | "weight";
  decimalPlaces: number;
}

export const Metric: React.FC<MetricProps> = ({
  label,
  value,
  unit,
  formatType,
  decimalPlaces,
}) => {
  const formattedValue = value
    ? formatKeyIndicator(value, formatType, decimalPlaces)
    : "-";

  return (
    <div className="flex flex-col text-center text-ink px-4 [&:not(:last-child)]:border-r-1 border-neutral-200">
      <p className="text-neutral-500 text-xs mb-1">{label}</p>
      <div className="flex flex-col justify-center flex-grow">
        <p className="text-2xl">{formattedValue}</p>
        {unit && <p className="text-xs font-bold mt-1">{unit}</p>}
      </div>
    </div>
  );
};

export default Metric;
