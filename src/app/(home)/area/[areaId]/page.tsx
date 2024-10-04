import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import PageHeader from "@/app/components/page-header";
import { EItemType } from "@/types/components";
import {
  Metric,
  MetricRow,
  PageSection,
  SectionHeader,
} from "@/app/components/page-section";
import { SIDEBAR_WIDTH } from "@/app/config";

const AreaPage = async ({
  params,
}: {
  params: {
    areaId: string;
  };
}) => {
  const area = await prisma.area.findUnique({
    where: {
      id: params.areaId,
    },
  });

  if (!area) {
    return redirect("/not-found");
  }

  const totalFlow = await prisma.flow.aggregate({
    where: {
      fromAreaId: area.id,
    },
    _sum: {
      value: true,
    },
  });

  return (
    <div className={`w-[${SIDEBAR_WIDTH}px]`}>
      <PageHeader title={area.name} itemType={EItemType.area} />
      <PageSection>
        <SectionHeader label="Food Produced" />
        <MetricRow>
          <Metric
            label="Calories produced"
            value={totalFlow._sum.value}
            unit="tonnes"
          />
          <Metric
            label="Agriculture sector in GDP"
            value={null}
            unit="billion 2010 USD$"
          />
          <Metric label="GDP per capita" value={null} unit="2011 USD$" />
        </MetricRow>
        <MetricRow>
          <Metric label="Total population" value={null} unit="million people" />
          <Metric label="Human Development Index" value={null} />
        </MetricRow>
      </PageSection>
    </div>
  );
};

export default AreaPage;
