"use client";

import React, { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";

// Xstate
import { MachineContext, MachineProvider } from "./state";
import { selectors } from "./state/selectors";

// Components
import { COORDINATE_SYSTEM, _GlobeView as GlobeView } from "@deck.gl/core";

import { SimpleMeshLayer } from "@deck.gl/mesh-layers";
import { SphereGeometry } from "@luma.gl/engine";
import { GlobeViewState } from "@deck.gl/core";
import { ArcLayer, GeoJsonLayer } from "@deck.gl/layers";
import { DeckGL } from "@deck.gl/react";

const EARTH_RADIUS_METERS = 6.3e6;

const INITIAL_VIEW_STATE: GlobeViewState = {
  longitude: -96,
  latitude: 38,
  zoom: 0.8,
};

function InnerPage() {
  const actorRef = MachineContext.useActorRef();
  const router = useRouter();

  // Page URL is derived from the machine context
  const pageUrl = MachineContext.useSelector(selectors.pageUrl);

  // The browser URL is updated when the selected country changes, but the page
  // does not reload because the target route should be in the rewrite rules
  // in the next.config.js file.
  useEffect(() => {
    router.push(pageUrl);
  }, [router, pageUrl]);

  const mapIsLoading = MachineContext.useSelector((state) =>
    state.matches("Map is loading")
  );

  const arcs = MachineContext.useSelector(selectors.currentCountryArcs);
  const countryLimitsGeoJSON = MachineContext.useSelector(
    (s) => s.context.countryLimitsGeoJSON
  );

  const backgroundLayers = useMemo(
    () =>
      countryLimitsGeoJSON
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
            new GeoJsonLayer({
              id: "country-limits",
              data: countryLimitsGeoJSON,
              pickable: true,
              opacity: 1,
              getFillColor: [211, 211, 211],
              getLineWidth: 10000,
              onClick: (info) => {
                actorRef.send({
                  type: "Select country",
                  countryId: info.object.properties.id,
                });
              },
            }),
          ]
        : [],
    [actorRef, countryLimitsGeoJSON]
  );

  const arcLayer = useMemo(
    () =>
      arcs &&
      arcs.length > 0 &&
      new ArcLayer({
        id: "arcs",
        data: arcs,
        getSourcePosition: (d) => d.sourcePosition,
        getTargetPosition: (d) => d.targetPosition,
        getSourceColor: [0, 128, 255],
        getTargetColor: [255, 0, 128],
        getHeight: 0.1,
      }),
    [arcs]
  );

  if (mapIsLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        Loading...
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gray-100 flex items-center justify-center">
      <div className="relative w-full h-full overflow-hidden">
        <DeckGL
          views={new GlobeView()}
          initialViewState={INITIAL_VIEW_STATE}
          controller={true}
          layers={[...backgroundLayers, arcLayer]}
        />
      </div>
    </div>
  );
}

export default function Globe() {
  return (
    <MachineProvider>
      <InnerPage />
    </MachineProvider>
  );
}
