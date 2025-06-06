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
      <h2 className="flex-grow font-header uppercase" data-section-heading>
        {label}
      </h2>
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

export interface IPageSection {
  id: string;
  children: React.ReactNode;
  className?: string;
}

export function PageSection({ id, children, className = "" }: IPageSection) {
  return (
    <div id={id} className={`py-8 px-6 ${className}`}>
      {children}
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
