import { useMemo } from "react";
import { DeckGL } from "@deck.gl/react";
import { ArcLayer, GeoJsonLayer } from "@deck.gl/layers";
import { SimpleMeshLayer } from "@deck.gl/mesh-layers";
import { COORDINATE_SYSTEM, _GlobeView as GlobeView } from "@deck.gl/core";
import { SphereGeometry } from "@luma.gl/engine";
import type { GlobeViewState } from "@deck.gl/core";
import { MachineContext } from "../state";
import { selectors } from "../state/selectors";

const EARTH_RADIUS_METERS = 6.3e6;

const INITIAL_VIEW_STATE: GlobeViewState = {
  longitude: -96,
  latitude: 38,
  zoom: 0.8,
};

export default function GlobePanel() {
  const actorRef = MachineContext.useActorRef();
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

  return (
    <div className="relative w-full h-full overflow-hidden">
      <DeckGL
        views={new GlobeView()}
        initialViewState={INITIAL_VIEW_STATE}
        controller={true}
        layers={[...backgroundLayers, arcLayer]}
        onLoad={() =>
          actorRef.send({
            type: "Deck.gl was loaded",
          })
        }
      />
    </div>
  );
}
