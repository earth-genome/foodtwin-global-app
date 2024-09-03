import { Link } from "@nextui-org/react";
import { X } from "@phosphor-icons/react/dist/ssr";

import Area from "@/app/components/icons/Area";
import Node from "@/app/components/icons/Node";
import Route from "@/app/components/icons/Route";
import { EPageType, IPageHeader } from "@/types/components";

function getTypeLabel(type: EPageType) {
  switch (type) {
    case EPageType.route:
      return "Transport Routes";
    case EPageType.area:
      return "Producing Areas";
    case EPageType.node:
      return "Ports & Depots";
  }
}

function typeIcon(type: EPageType) {
  switch (type) {
    case EPageType.route:
      return <Route />;
    case EPageType.area:
      return <Area />;
    case EPageType.node:
      return <Node />;
  }
}

function PageHeader({ title, type }: IPageHeader) {
  return (
    <div className="bg-neutral-900 text-white p-4 flex gap-4 items-start">
      <div className="flex-grow">
        <div className="flex items-center gap-2 mb-4">
          {typeIcon(type)}
          <span
            className={`font-header text-xs text-category-${type} uppercase`}
          >
            {getTypeLabel(type)}
          </span>
        </div>
        <h1 className="font-header text-4xl">{title}</h1>
      </div>
      <Link href="/">
        <X className="text-neutral-400" size={24} />
      </Link>
    </div>
  );
}

export default PageHeader;