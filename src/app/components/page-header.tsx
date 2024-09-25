import Link from "next/link";
import { X } from "@phosphor-icons/react/dist/ssr";

import { EItemType, IPageHeader } from "@/types/components";
import TypeIcon from "./icons/type-icon";

function getTypeLabel(itemType: EItemType) {
  switch (itemType) {
    case EItemType.route:
      return "Transport Routes";
    case EItemType.area:
      return "Producing Areas";
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

export default PageHeader;
