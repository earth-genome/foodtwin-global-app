import { Button, Tooltip } from "@nextui-org/react";
import { Info } from "@phosphor-icons/react/dist/ssr";

interface ISectionHeader {
  label: string;
  tooltip?: string;
}

export function SectionHeader({ label, tooltip }: ISectionHeader) {
  return (
    <div className="flex items-center">
      <h2 className="flex-grow">{label}</h2>
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
  children: React.ReactNode;
}

export function PageSection({ children }: IPageSection) {
  return (
    <div className="p-4 font-header text-neutral-700 uppercase">{children}</div>
  );
}
