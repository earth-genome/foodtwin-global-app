"use client";
import { IPageSection, PageSection } from "@/app/components/page-section";
import { useSearchParams } from "next/navigation";

export function ScrollSection(props: IPageSection) {
  const p = useSearchParams();

  return (
    <PageSection
      {...props}
      className={
        p.get("view") !== props.id ? "scroll-block inactive" : "scroll-block"
      }
    />
  );
}
