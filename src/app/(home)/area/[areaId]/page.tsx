import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import PageHeader from "@/app/components/page-header";
import { EItemType } from "@/types/components";
import { PageSection, SectionHeader } from "@/app/components/page-section";
import { Metric, MetricRow } from "@/app/components/metric";
import { AreaMeta } from "../../../../../prisma/seed/nodes";

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

  const [
    { _sum: totalFlow }
  ] = await Promise.all([
    prisma.flow.aggregate({
      where: {
        fromAreaId: area.id,
      },
      _sum: {
        value: true,
      },
    })
  ]);

  const meta = area.meta as AreaMeta;

  const areaLabel = meta.iso3 ? `${area.name}, ${meta.iso3}` : area.name;

  return (
    <div className={`w-[600px] bg-white`}>
      <PageHeader title={areaLabel} itemType={EItemType.area} />
      <PageSection>
        <SectionHeader label="Food Produced" />
        <MetricRow>
          <Metric
            label="Total production"
            value={totalFlow.value ?? undefined}
            formatType="weight"
            decimalPlaces={0}
          />
          <Metric
            label="Agriculture sector in GDP"
            value={meta.aggdp_2010}
            formatType="metric"
            decimalPlaces={3}
            unit="2010 USD$"
          />
          <Metric
            label="GDP per capita"
            value={meta.gdppc}
            formatType="metric"
            decimalPlaces={1}
            unit="2011 USD$"
          />
        </MetricRow>
        <MetricRow>
          <Metric
            label="Total population"
            value={meta.totalpop}
            formatType="metric"
            decimalPlaces={1}
          />
          <Metric
            label="Human Development Index"
            value={meta.hdi}
            formatType="metric"
            decimalPlaces={3}
          />
        </MetricRow>
      </PageSection>
    </div>
  );
};

export default AreaPage;
