import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import PageHeader from "@/app/components/page-header";
import { EItemType } from "@/types/components";
import { PageSection, SectionHeader } from "@/app/components/page-section";
import { Metric, MetricRow } from "@/app/components/metric";
import { AreaMeta } from "../../../../../prisma/seed/nodes";
import { FoodGroup } from "@prisma/client";
import { ListBars } from "@/app/components/charts";
import { formatKeyIndicator } from "@/utils/numbers";

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
    foodGroups
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
    prisma.foodGroup.findMany()
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
  }, {})

  const totalFlow = foodGroupExports.reduce((partialSum, { _sum }) => _sum.value ? partialSum + _sum.value : partialSum, 0)
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
    </div>
  );
};

export default AreaPage;
