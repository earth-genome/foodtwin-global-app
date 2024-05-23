import { useCallback, useMemo, useState } from "react";
import { DeckGL } from "@deck.gl/react";

import { GeoJsonLayer } from "@deck.gl/layers";
import { SimpleMeshLayer } from "@deck.gl/mesh-layers";
import { COORDINATE_SYSTEM, _GlobeView as GlobeView } from "@deck.gl/core";

import { SphereGeometry } from "@luma.gl/engine";

import type { GlobeViewState } from "@deck.gl/core";

const EARTH_RADIUS_METERS = 6.3e6;

const INITIAL_VIEW_STATE: GlobeViewState = {
  longitude: -96,
  latitude: 38,
  zoom: 0.8,
};

export default function GlobePanel() {
  const backgroundLayers = useMemo(
    () => [
      new SimpleMeshLayer({
        id: "earth-sphere",
        data: [0],
        mesh: new SphereGeometry({
          radius: EARTH_RADIUS_METERS,
          nlat: 18,
          nlong: 36,
        }),
        coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
        getPosition: [0, 0, 0],
        getColor: [173, 216, 230],
      }),
      new GeoJsonLayer({
        id: "earth-land",
        data: "/naturalearth-3.3.0/ne_50m_admin_0_countries.geojson",
        pickable: true,
        opacity: 1,
        getFillColor: [211, 211, 211],
        getLineWidth: 10000,
        onClick: (info) => {
          const areaName = info.object.properties.name;
          alert(`Clicked on ${areaName}`);
        },
      }),
    ],
    []
  );

  return (
    <>
      <div className="relative w-full h-full overflow-hidden">
        <DeckGL
          views={new GlobeView()}
          initialViewState={INITIAL_VIEW_STATE}
          controller={true}
          layers={[backgroundLayers]}
        />
      </div>
    </>
  );
}
