import { formatNumber } from "@/utils/numbers";
import {
  Button,
  Tooltip,
  Tabs as NextUiTabs,
  TabsProps,
} from "@nextui-org/react";
import { Info } from "@phosphor-icons/react/dist/ssr";

interface ISectionHeader {
  label: string;
  tooltip?: string;
}

export function SectionHeader({ label, tooltip }: ISectionHeader) {
  return (
    <div className="flex items-center text-neutral-700 mb-8">
      <h2 className="flex-grow font-header uppercase">{label}</h2>
      {tooltip && (
        <Tooltip
          content={
            <div className="text-neutral-400 p-2">
              <p className="text-white mb-2">{label}</p>
              <p>{tooltip}</p>
            </div>
          }
          placement="left"
          showArrow
          classNames={{
            base: ["before:bg-neutral-900"],
            content: ["bg-neutral-900 w-80"],
          }}
        >
          <Button isIconOnly variant="light" radius="full" size="sm">
            <Info size={20} />
          </Button>
        </Tooltip>
      )}
    </div>
  );
}

interface IPageSection {
  id: string;
  children: React.ReactNode;
}

export function PageSection({ id, children }: IPageSection) {
  return (
    <div id={id} className="p-4">
      {children}
    </div>
  );
}

interface IMetricRow {
  children: React.ReactNode;
}

export function MetricRow({ children }: IMetricRow) {
  return <div className="flex justify-center my-8">{children}</div>;
}

interface IMetric {
  label: string;
  value: number | null;
  unit?: string;
}

export function Metric({ label, value, unit }: IMetric) {
  return (
    <div className="text-center text-ink px-4 [&:not(:last-child)]:border-r-1 border-neutral-200">
      <p className="text-neutral-500 text-xs">{label}</p>
      <p className="text-2xl">{value ? formatNumber(value) : "-"}</p>
      {unit && <p className="text-xs font-bold mt-1">{unit}</p>}
    </div>
  );
}

export function Tabs({ children, ...props }: TabsProps) {
  return (
    <div className="my-8">
      <NextUiTabs
        {...props}
        fullWidth
        classNames={{
          tab: "font-header text-sm tracking-tighter",
        }}
      >
        {children}
      </NextUiTabs>
    </div>
  );
}
