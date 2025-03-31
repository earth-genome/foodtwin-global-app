"use client";

import useSWR from "swr";
import { Layer, Source } from "react-map-gl";
import { FromToFlowsResponse } from "@/app/api/areas/[id]/flows/route";

const fetcher = (url: string) =>
  fetch(url)
    .then((res) => res.json())
    .then((data: FromToFlowsResponse): FromToFlowsResponse => {
      return {
        ...data,
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

  const maxTotalValue = Math.max(
    ...data.flowGeometriesGeojson.features.map(
      (feature) => feature.properties?.totalValue || 0
    )
  );
  const minTotalValue = Math.min(
    ...data.flowGeometriesGeojson.features.map(
      (feature) => feature.properties?.totalValue || 0
    )
  );

  return (
    <Source id="source_id" type="geojson" data={data?.flowGeometriesGeojson}>
      <Layer
        id="area-flows-outline"
        type="line"
        source="source_id"
        layout={{
          "line-join": "round",
          "line-cap": "round",
          visibility: "visible", // or controlled via props
        }}
        paint={{
          "line-color": "#000000",
          "line-opacity": 0.4,
          "line-width": [
            "interpolate",
            ["linear"],
            ["get", "totalValue"],
            minTotalValue,
            3,
            maxTotalValue,
            10,
          ],
        }}
      />
      <Layer
        id="area-flows"
        type="line"
        source="source_id"
        layout={{
          "line-join": "round",
          "line-cap": "round",
          visibility: "visible",
        }}
        paint={{
          "line-color": "#ffffff", // or your actual color logic
          "line-opacity": 0.9,
          "line-width": [
            "interpolate",
            ["linear"],
            ["get", "totalValue"],
            minTotalValue,
            1,
            maxTotalValue,
            8,
          ],
        }}
      />
    </Source>
  );
};

export default AreaFlowsLayer;
