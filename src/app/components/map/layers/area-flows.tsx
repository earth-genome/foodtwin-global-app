"use client";

import useSWR from "swr";
import { Layer, Source } from "react-map-gl";
import { FromToFlowsResponse } from "@/app/api/areas/[id]/flows/route";
import { FoodGroupColors } from "../../../../../tailwind.config";
import { Feature } from "geojson";

const fetcher = (url: string) =>
  fetch(url)
    .then((res) => res.json())
    .then((data: FromToFlowsResponse): FromToFlowsResponse => {
      const flowGeometries = data.flows.map((flow) => {
        const flowPairGeometry = data.flowGeometriesGeojson.features.find(
          (feature) =>
            feature?.properties?.fromAreaId === flow.fromAreaId &&
            feature.properties.toAreaId === flow.toAreaId
        );
        if (flowPairGeometry?.geometry) {
          const colorHex =
            FoodGroupColors[
              flow.level3FoodGroupSlug as keyof typeof FoodGroupColors
            ];

          return {
            type: "Feature",
            geometry: flowPairGeometry.geometry,
            properties: {
              fromAreaId: flow.fromAreaId,
              toAreaId: flow.toAreaId,
              color: colorHex,
              value: flow.value,
              foodGroupId: flow.foodGroupId,
            },
          } as Feature;
        }
        return null;
      });

      return {
        ...data,
        flowGeometriesGeojson: {
          type: "FeatureCollection",
          features: flowGeometries.filter((f) => !!f),
        },
      };
    })
    .catch((error) => {
      // eslint-disable-next-line no-console
      console.error("Error fetching area flows", error);
      throw error;
    });

const AreaFlowsLayer = ({ areaId }: { areaId: string }) => {
  const { data, error, isLoading } = useSWR<FromToFlowsResponse>(
    `/api/areas/${areaId}/flows`,
    fetcher,
    {
      keepPreviousData: true,
    }
  );

  if (error || isLoading || !data) return null;

  return (
    <Source id="source_id" type="geojson" data={data?.flowGeometriesGeojson}>
      <Layer
        id="layer_id"
        type="line"
        source="source_id"
        layout={{
          "line-join": "round",
          "line-cap": "round",
        }}
        paint={{
          "line-color": ["get", "color"],
          "line-width": [
            "interpolate",
            ["linear"],
            ["get", "value"],
            0,
            2,
            50000000000,
            20,
          ],
        }}
      />
    </Source>
  );
};

export default AreaFlowsLayer;
