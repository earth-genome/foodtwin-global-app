import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import PageHeader from "@/app/components/page-header";
import { EItemType } from "@/types/components";
import ScrollTracker from "./scroll-tracker";
import { PageSection, SectionHeader } from "@/app/components/page-section";
import { Metric, MetricRow } from "@/app/components/metric";
import { AreaMeta } from "../../../../../prisma/seed/nodes";
import { FoodGroup, Prisma } from "@prisma/client";
import { ListBars, Sankey } from "@/app/components/charts";
import { formatKeyIndicator } from "@/utils/numbers";
import { EAreaViewType } from "@/app/components/map/state/machine";

interface IFoodGroupAgg extends FoodGroup {
  sum: number;
  values: {
    _sum: { value: number | null };
    foodGroupId: number;
  }[]
}

interface IFoodGroupAggObj {
  [key: string]: IFoodGroupAgg
}

interface ImportSum {
  sum: number;
}

interface ExportFlow {
  mode: "road" | "rail" | "IWW";
  value: number;
  toAreaId: string;
  name: string;
  type: "MARITIME" | "PORT" | "INLAND_PORT" | "RAIL_STATION" | "ADMIN";
}

function findParent(id: number, foodGroups: FoodGroup[]) {
  const g = foodGroups.find((group) => id === group.id);
  if (!g!.parentId) {
    return g;
  } else {
    return findParent(g!.parentId, foodGroups);
  }
};

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
    foodGroupExports,
    foodGroups,
    inBoundFlows,
    outboundFlows,
  ] = await Promise.all([
    prisma.flow.groupBy({
      where: {
        fromAreaId: area.id,
      },
      by: ['foodGroupId'],
      _sum: {
        value: true,
      },
    }),
    prisma.foodGroup.findMany(),
    prisma.$queryRawUnsafe(`
      SELECT sum(value)
        FROM "FlowSegment"
        LEFT JOIN "Flow" ON "FlowSegment"."flowId" = "Flow"."id"
        WHERE "flowId" like '%-${area.id}-%';
    `),
    prisma.$queryRawUnsafe(
      `SELECT "mode", sum("value") as value, "toAreaId", "Node"."name", "Node"."type"
        FROM "FlowSegment"
        LEFT JOIN "Flow" ON "FlowSegment"."flowId" = "Flow"."id"
        LEFT JOIN "Node" ON "Flow"."toAreaId" = "Node"."id"
        WHERE "flowId" LIKE '${area.id}-%' AND "order" = 1
        GROUP BY "toAreaId", "mode", "Node"."name", "Node"."type"
        ORDER BY value DESC;
    `),
  ]);

  const foodGroupAgg = foodGroupExports.reduce((agg: IFoodGroupAggObj, group): IFoodGroupAggObj => {
    const parent = findParent(group.foodGroupId, foodGroups);

    if (!parent) return agg;

    const parentId = parent.id.toString();

    if (Object.keys(agg).includes(parentId)) {
      return {
        ...agg,
        [parentId]: {
          ...parent,
          sum: group._sum.value ? agg[parentId].sum + group._sum.value : agg[parentId].sum,
          values: [
            ...agg[parentId].values,
            group
          ]
        }
      }
    } else {
      return {
        ...agg,
        [parentId]: {
          ...parent,
          sum: group._sum.value || 0,
          values: [
            group
          ]
        }
      }
    }
  }, {});

  const totalFlow = foodGroupExports.reduce((partialSum, { _sum }) => _sum.value ? partialSum + _sum.value : partialSum, 0);
  const totalExport = (outboundFlows as ExportFlow[]).reduce((partialSum, { value }) => partialSum + value, 0);
  const meta = area.meta as AreaMeta;
  const areaLabel = meta.iso3 ? `${area.name}, ${meta.iso3}` : area.name;

  return (
    <div className={`w-[600px] bg-white h-screen grid grid-rows-[max-content_1fr]`}>
      <PageHeader title={areaLabel} itemType={EItemType.area} />
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
            data={Object.values(foodGroupAgg).map(
              ({ name, sum }) => ({
                label: name,
                value: sum,
              })
            )}
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
              label="Suplied to the region"
              value={(inBoundFlows as ImportSum[])[0].sum}
              formatType="weight"
              decimalPlaces={0}
            />
          </MetricRow>
          <Sankey
            width={400}
            height={600}
            data={{
              nodes: [
                { id: area.id, label: area.name, type: EItemType["area"] },
                { id: "other", label: "Other", type: EItemType["node"] },
                ...(outboundFlows as ExportFlow[]).map(({ toAreaId, name, value }) => ({
                  id: toAreaId,
                  label: name,
                  type: EItemType["node"]
                }))
              ],
              links: [
                  ...(outboundFlows as ExportFlow[]).slice(0, 10).map(({ toAreaId, value }) => ({
                    source: area.id,
                    target: toAreaId,
                    value,
                    popupData: [{
                      label: "Volume",
                      value: formatKeyIndicator(value, "weight", 0),
                    }]
                  })),
                  {
                    source: area.id,
                    target: "other",
                    value: (outboundFlows as ExportFlow[]).slice(10).reduce((sum, { value }) => sum + value, 0),
                  }
              ]
            }}
          />
        </PageSection>
        <PageSection id={EAreaViewType.impact}>
          <SectionHeader label="Impact on people" />
          <div className="bg-neutral-100 h-[400px]">chart</div>
        </PageSection>
      </ScrollTracker>
    </div>
  );
};

export default AreaPage;
