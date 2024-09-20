import TypeIcon from "@/app/components/icons/type-icon";
import { EItemType } from "@/types/components";
import { IResult } from "@/types/data";
import Link from "next/link";

interface IResultsPage {
  results: IResult[];
  q: string;
}

function generateItemLink(type: EItemType, id: string) {
  switch (type) {
    case EItemType.area:
      return `/area/${id}`;
    case EItemType.node:
      return `/node/${id}`;
    case EItemType.route:
      return `/route/${id}`;
  }
}

function Results({ results, q }: IResultsPage) {
  if (results.length === 0) {
    return (
      <div className="text-2xl text-neutral-600">
        “<span className="text-neutral-900">{q}</span>” didn&apos;t return any
        results. <br />
        Please check spelling and try again.
      </div>
    );
  }

  return (
    <ul className="font-header text-2xl text-neutral-800 tracking-tight">
      {results.map(({ id, name, type }) => {
        const linkHref = generateItemLink(type, id);
        return (
          <li key={id} className="flex items-center gap-4 mb-2">
            <TypeIcon itemType={type} />{" "}
            <Link href={linkHref} className="hover:underline">
              {name}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export default Results;
