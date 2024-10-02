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

  const meta = area.meta as {
    iso3?: string;
    totalpop?: number;
    hdi?: number;
    aggdp_2010?: number;
    gdppc?: number;
  };

  const areaLabel = meta.iso3 ? `${area.name}, ${meta.iso3}` : area.name;

  return (
    <div className="w-[480px]">
      <PageHeader title={areaLabel} itemType={EItemType.area} />
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
            value={meta.aggdp_2010}
            unit="billion 2010 USD$"
          />
          <Metric label="GDP per capita" value={meta.gdppc} unit="2011 USD$" />
        </MetricRow>
        <MetricRow>
          <Metric
            label="Total population"
            value={meta.totalpop}
            unit="million people"
          />
          <Metric label="Human Development Index" value={meta.hdi} />
        </MetricRow>
      </PageSection>
    </div>
  );
};

export default AreaPage;
