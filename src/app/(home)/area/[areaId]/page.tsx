import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import PageHeader from "@/app/components/page-header";
import { EItemType } from "@/types/components";
import ScrollTracker from "./scroll-tracker";
import { PageSection, SectionHeader } from "@/app/components/page-section";
import { Metric, MetricRow } from "@/app/components/metric";
import { AreaMeta, IndicatorColumn } from "../../../../../prisma/seed/nodes";
import { FoodGroup } from "@prisma/client";
import { Arc, ListBars, Sankey } from "@/app/components/charts";
import { formatKeyIndicator } from "@/utils/numbers";
import { EAreaViewType } from "@/app/components/map/state/machine";
import { Button } from "@nextui-org/react";
import Link from "next/link";

import { FoodGroupColors } from "../../../../../tailwind.config";

const SANKEY_LINKS_COUNT = 5;
const SANKEY_HEIGHT = 600;
const SANKEY_WIDTH = 435;

interface IFoodGroupAgg extends FoodGroup {
  sum: number;
  values: {
    _sum: { value: number | null };
    foodGroupId: number;
  }[];
}

type IFoodGroupAggObj = Record<string, IFoodGroupAgg>;

interface ImportSum {
  sum: number;
}

interface ExportFlow {
  mode: "road" | "rail" | "IWW";
  value: number;
  toAreaId: string;
  name: string;
  iso3: string;
  type: "MARITIME" | "PORT" | "INLAND_PORT" | "RAIL_STATION" | "ADMIN";
}

interface Indicators {
  totalPopulation: number;
  ruralPopulation: number;
  elderlyPopulation: number;
  childBearingPopulation: number;
  under5Population: number;
}

function findParent(id: number, foodGroups: FoodGroup[]) {
  const g = foodGroups.find((group) => id === group.id);
  if (!g?.parentId) {
    return g;
  } else {
    return findParent(g?.parentId, foodGroups);
  }
}

function getAreaLabel(area: {
  name: string;
  iso3?: string;
  meta?: {
    iso3?: string;
  };
}) {
  if (area.iso3) {
    return `${area.name}, ${area.iso3}`;
  } else if (area.meta?.iso3) {
    return `${area.name}, ${area.meta.iso3}`;
  } else {
    return area.name;
  }
}

const OutboundSankey = ({
  area,
  outboundFlows,
}: {
  area: { id: string; name: string };
  outboundFlows: ExportFlow[];
}) => {
  const visibleFlows = outboundFlows.slice(0, SANKEY_LINKS_COUNT);
  const otherFlows = outboundFlows.slice(SANKEY_LINKS_COUNT);

  const otherFlowsSum = otherFlows.reduce((sum, { value }) => sum + value, 0);

  const mainNode = {
    id: area.id,
    label: getAreaLabel(area),
    type: EItemType.area,
  };

  const visibleNodes = visibleFlows.map((flow) => ({
    id: flow.toAreaId,
    label: getAreaLabel(flow),
    type: EItemType.area,
  }));

  const visibleLinks = visibleFlows.map(({ toAreaId, value }) => ({
    source: area.id,
    target: toAreaId,
    value,
    popupData: [
      {
        label: "Volume",
        value: formatKeyIndicator(value, "weight", 0),
      },
    ],
  }));

  const allNodes = [mainNode, ...visibleNodes];
  const allLinks = [...visibleLinks];

  if (otherFlowsSum > 0) {
    const otherNode = {
      id: "other",
      label: "Other Areas",
      type: EItemType.area,
    };

    const otherLink = {
      source: area.id,
      target: "other",
      value: otherFlowsSum,
      popupData: [
        {
          label: "Volume",
          value: formatKeyIndicator(otherFlowsSum, "weight", 0),
        },
      ],
    };

    allNodes.push(otherNode);
    allLinks.push(otherLink);
  }

  return (
    <Sankey
      width={SANKEY_WIDTH}
      height={SANKEY_HEIGHT}
      data={{
        nodes: allNodes,
        links: allLinks,
      }}
    />
  );
};

const AreaPage = async ({
  params,
}: {
  params: {
    areaId: string;
  };
}) => {
  const area = await prisma.area.findUnique({
    select: {
      id: true,
      name: true,
      meta: true,
    },
    where: {
      id: params.areaId,
    },
  });

  if (!area) {
    return redirect("/not-found");
  }

  const [
    foodGroupExports,
    foodGroups,
    inBoundFlows,
    outboundFlows,
    outboundAreas,
  ] = await Promise.all([
    prisma.flow.groupBy({
      where: {
        fromAreaId: area.id,
      },
      by: ["foodGroupId"],
      _sum: {
        value: true,
      },
    }),
    prisma.foodGroup.findMany(),
    prisma.$queryRawUnsafe(`
      SELECT sum(value)
        FROM "Flow"
        WHERE "toAreaId" = '${area.id}'
        GROUP BY "toAreaId";
    `),
    prisma.$queryRawUnsafe(
      `SELECT "toAreaId", "Area".name, ST_AsText(ST_Transform("Area".centroid, 4326)), sum(value) as value, "Area".meta->>'iso3' as iso3
        FROM "Flow"
        JOIN "Area" ON "Flow"."toAreaId" = "Area"."id"
        WHERE "Flow"."fromAreaId" = '${area.id}'
        GROUP BY "toAreaId", "Area".name, "Area".centroid, "Area".meta
        ORDER BY value DESC;
    `
    ),
    prisma.area.findMany({
      select: {
        id: true,
        name: true,
        meta: true,
      },
      where: {
        flowsTo: {
          some: {
            fromAreaId: area.id,
          },
        },
      },
    }),
  ]);

  const indicators: Indicators = [area, ...outboundAreas].reduce<Indicators>(
    (sum, { meta }) => {
      if (!meta) return sum;

      /*
       * In the following we are ignoring errors with meta objects. We should
       * look into making the indicators as area columns to avoid this.
       * See: https://github.com/earth-genome/foodtwin-global-app/issues/91
       */

      return {
        // @ts-expect-error - we should avoid using meta keys directly
        totalPopulation: sum.totalPopulation + meta[IndicatorColumn.TOTALPOP],
        // @ts-expect-error - we should avoid using meta keys directly
        ruralPopulation: sum.ruralPopulation + meta[IndicatorColumn.NUM_RURAL],
        elderlyPopulation:
          // @ts-expect-error - we should avoid using meta keys directly
          sum.elderlyPopulation + meta[IndicatorColumn.NUM_ELDERLY],
        childBearingPopulation:
          // @ts-expect-error - we should avoid using meta keys directly
          sum.childBearingPopulation + meta[IndicatorColumn.NUM_F_CHILDBEARING],
        under5Population:
          // @ts-expect-error - we should avoid using meta keys directly
          sum.under5Population + meta[IndicatorColumn.NUM_UNDER5],
      };
    },
    {
      totalPopulation: 0,
      ruralPopulation: 0,
      elderlyPopulation: 0,
      childBearingPopulation: 0,
      under5Population: 0,
    }
  );

  const foodGroupAgg = foodGroupExports.reduce(
    (agg: IFoodGroupAggObj, group): IFoodGroupAggObj => {
      const parent = findParent(group.foodGroupId, foodGroups);

      if (!parent) return agg;

      const parentId = parent.id.toString();

      if (Object.keys(agg).includes(parentId)) {
        return {
          ...agg,
          [parentId]: {
            ...parent,
            sum: group._sum.value
              ? agg[parentId].sum + group._sum.value
              : agg[parentId].sum,
            values: [...agg[parentId].values, group],
          },
        };
      } else {
        return {
          ...agg,
          [parentId]: {
            ...parent,
            sum: group._sum.value || 0,
            values: [group],
          },
        };
      }
    },
    {}
  );

  const totalFlow = foodGroupExports.reduce(
    (partialSum, { _sum }) =>
      _sum.value ? partialSum + _sum.value : partialSum,
    0
  );
  const totalExport = (outboundFlows as ExportFlow[]).reduce(
    (partialSum, { value }) => partialSum + value,
    0
  );
  const meta = area.meta as AreaMeta;
  const areaLabel = meta.iso3 ? `${area.name}, ${meta.iso3}` : area.name;

  return (
    <>
      <PageHeader title={areaLabel} itemType={EItemType.area} />
      {totalFlow === 0 ? (
        <PageSection
          id="no-flows"
          className="p-10 flex flex-grow flex-col items-center justify-center gap-4"
        >
          <p>There is no food produced in this area or no data is available.</p>
          <Button
            className="w-full rounded text-sm text-white bg-accent-warm-400"
            href="/"
            as={Link}
          >
            Go to World Map
          </Button>
        </PageSection>
      ) : (
        <ScrollTracker>
          <PageSection id={EAreaViewType.production}>
            <SectionHeader label="Food Produced" />
            <MetricRow>
              <Metric
                label="Total production"
                value={totalFlow ?? undefined}
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

            <ListBars
              showPercentage
              formatType="weight"
              data={Object.values(foodGroupAgg).map(({ name, sum, slug }) => ({
                label: name,
                value: sum,
                color: slug
                  ? FoodGroupColors[slug as keyof typeof FoodGroupColors]
                  : undefined,
              }))}
            />
          </PageSection>
          <PageSection id={EAreaViewType.transportation}>
            <SectionHeader label="Food Transportation" />
            <MetricRow>
              <Metric
                label="Exported outside the region"
                value={totalExport}
                formatType="weight"
                decimalPlaces={0}
              />
              <Metric
                label="Supplied to the region"
                value={(inBoundFlows as ImportSum[])[0]?.sum ?? 0}
                formatType="weight"
                decimalPlaces={0}
              />
            </MetricRow>
            <OutboundSankey
              area={area}
              outboundFlows={outboundFlows as ExportFlow[]}
            />
          </PageSection>
          <PageSection id={EAreaViewType.impact} className="pb-8">
            <SectionHeader label="Impact on people" />
            <MetricRow>
              <Metric
                label="Number of people in the flow areas"
                value={indicators.totalPopulation}
                formatType="metric"
                decimalPlaces={0}
              />
            </MetricRow>
            <div className="flex flex-wrap gap-6 justify-around items-end">
              <Arc
                title="Rural"
                percentage={
                  (indicators.ruralPopulation / indicators.totalPopulation) *
                  100
                }
              />
              <Arc
                title="Elderly"
                percentage={
                  (indicators.elderlyPopulation / indicators.totalPopulation) *
                  100
                }
              />

              <Arc
                title="Women of child-bearing age"
                percentage={
                  (indicators.childBearingPopulation /
                    indicators.totalPopulation) *
                  100
                }
              />
              <Arc
                title="Children under 5"
                percentage={
                  (indicators.under5Population / indicators.totalPopulation) *
                  100
                }
              />
            </div>
          </PageSection>
        </ScrollTracker>
      )}
    </>
  );
};

export default AreaPage;
