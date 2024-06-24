"use client";
import { DeckGL } from "@deck.gl/react";
import { MapView } from "@deck.gl/core";
import { COORDINATE_SYSTEM, _GlobeView as GlobeView } from "@deck.gl/core";

import type { GlobeViewState } from "@deck.gl/core";
import { MVTLayer } from "@deck.gl/geo-layers";
import { useMemo, useState } from "react";
import { Button } from "@nextui-org/react";
import { SimpleMeshLayer } from "@deck.gl/mesh-layers";
import { SphereGeometry } from "@luma.gl/engine";

const EARTH_RADIUS_METERS = 6.3e6;

const INITIAL_VIEW_STATE: GlobeViewState = {
  longitude: 0,
  latitude: 0,
  zoom: 0.8,
};

export default function GlobePanel() {
  const [isGlobeView, setIsGlobeView] = useState(false);

  const layers = useMemo(
    () =>
      isGlobeView
        ? [
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
            new MVTLayer({
              id: "areas",
              data: "/api/tiles/{z}/{x}/{y}",
              getFillColor: [211, 211, 211],
              getLineWidth: 1000,
            }),
          ]
        : [
            new MVTLayer({
              id: "areas",
              data: "/api/tiles/{z}/{x}/{y}",
              getFillColor: [211, 211, 211],
              getLineWidth: 1000,
            }),
          ],
    [isGlobeView]
  );

  return (
    <div className="flex h-screen">
      <div className="flex-1 bg-gray-100 flex items-center justify-center">
        <div className="relative w-full h-full overflow-hidden">
          <DeckGL
            views={isGlobeView ? new GlobeView() : new MapView()}
            initialViewState={INITIAL_VIEW_STATE}
            controller={true}
            layers={layers}
          />
          <Button
            color="primary"
            onClick={() => setIsGlobeView(!isGlobeView)}
            style={{
              position: "absolute",
              top: "10px",
              right: "10px",
            }}
          >
            {isGlobeView ? "Switch to Flat View" : "Switch to Globe View"}
          </Button>
        </div>
      </div>
    </div>
  );
}
