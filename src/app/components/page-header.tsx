import Link from "next/link";
import { X } from "@phosphor-icons/react/dist/ssr";

import { EItemType, IPageHeader } from "@/types/components";
import TypeIcon from "./icons/type-icon";

function getTypeLabel(itemType: EItemType) {
  switch (itemType) {
    case EItemType.route:
      return "Transport Routes";
    case EItemType.area:
      return "Regions and Countries";
    case EItemType.node:
      return "Ports & Depots";
  }
}

function PageHeader({ title, itemType }: IPageHeader) {
  return (
    <div className="bg-neutral-900 text-white p-4 flex gap-4 items-start">
      <div className="flex-grow">
        <div className="flex items-center gap-2 mb-4">
          <TypeIcon itemType={itemType} />
          <span
            className={`font-header text-xs text-category-${itemType} uppercase`}
          >
            {getTypeLabel(itemType)}
          </span>
        </div>
        <h1 className="font-header text-4xl tracking-tighter">{title}</h1>
      </div>
      <Link href="/">
        <X className="text-neutral-400" size={24} />
      </Link>
    </div>
  );
}

export function PageHeaderSkeleton() {
  return (
    <div className="bg-neutral-900 p-4 flex gap-4 items-start">
      <div className="flex-grow">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-neutral-800 rounded-full" />
          <div className="w-16 h-4 bg-neutral-800 rounded-full" />
        </div>
        <div className="w-48 h-9 rounded-full bg-neutral-800" />
      </div>
      <div className="w-7 h-7 rounded-full bg-neutral-800" />
    </div>
  );
}

export default PageHeader;
