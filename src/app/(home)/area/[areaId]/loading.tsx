import { PageHeaderSkeleton } from "@/app/components/page-header";
import Layout from "./layout";
import { PageSection } from "@/app/components/page-section";
import { EAreaViewType } from "@/app/components/map/state/machine";
import { MetricRow, SkeletonMetric } from "@/app/components/metric";
import { Skeleton } from "@nextui-org/react";

export default function Loading() {
  return (
    <Layout>
      <PageHeaderSkeleton />
      <PageSection id={EAreaViewType.production}>
        <div className="flex items-center text-neutral-700 mb-8">
          <Skeleton className="w-36 h-8 rounded-lg" />
        </div>
        <MetricRow>
          <SkeletonMetric />
          <SkeletonMetric />
          <SkeletonMetric />
        </MetricRow>
        <MetricRow>
          <SkeletonMetric />
          <SkeletonMetric />
        </MetricRow>

        <Skeleton className="w-full h-12 rounded-lg my-4" />
        <Skeleton className="w-full h-12 rounded-lg my-4" />
        <Skeleton className="w-full h-12 rounded-lg my-4" />
        <Skeleton className="w-full h-12 rounded-lg my-4" />
        <Skeleton className="w-full h-12 rounded-lg my-4" />
        <Skeleton className="w-full h-12 rounded-lg my-4" />
        <Skeleton className="w-full h-12 rounded-lg my-4" />
        <Skeleton className="w-full h-12 rounded-lg my-4" />
        <Skeleton className="w-full h-12 rounded-lg my-4" />
        <Skeleton className="w-full h-12 rounded-lg my-4" />
        <Skeleton className="w-full h-12 rounded-lg my-4" />
      </PageSection>
    </Layout>
  );
}
