import { useMemo, useState } from "react";
import { DeckGL } from "@deck.gl/react";
import { ArcLayer, GeoJsonLayer } from "@deck.gl/layers";
import { SimpleMeshLayer } from "@deck.gl/mesh-layers";
import { COORDINATE_SYSTEM, _GlobeView as GlobeView } from "@deck.gl/core";
import { SphereGeometry } from "@luma.gl/engine";
import type { GlobeViewState } from "@deck.gl/core";
import {
  CountryCapitalsGeoJSON,
  CountryLimitsGeoJSON,
} from "@/types/countries";
import { Position } from "geojson";

const EARTH_RADIUS_METERS = 6.3e6;

const INITIAL_VIEW_STATE: GlobeViewState = {
  longitude: -96,
  latitude: 38,
  zoom: 0.8,
};

interface GlobePanelProps {
  countryLimitsGeojson: CountryLimitsGeoJSON;
  countryCapitalsGeojson: CountryCapitalsGeoJSON;
}

interface ArcData {
  sourcePosition: Position;
  targetPosition: Position;
}

export default function GlobePanel({
  countryLimitsGeojson,
  countryCapitalsGeojson,
}: GlobePanelProps) {
  const [arcs, setArcs] = useState<ArcData[]>([]);

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
        id: "country-limits",
        data: countryLimitsGeojson,
        pickable: true,
        opacity: 1,
        getFillColor: [211, 211, 211],
        getLineWidth: 10000,
        onClick: (info) => {
          const originCountry = countryCapitalsGeojson.features.find(
            (feature) => feature.properties.id === info.object.properties.id
          );

          if (!originCountry) {
            return;
          }

          const targetCountries = countryCapitalsGeojson.features
            .filter(
              (feature) => feature.properties.id !== info.object.properties.id
            )
            .sort(() => Math.random() - 0.5)
            .slice(0, 10);

          if (targetCountries.length === 0) {
            return;
          }

          const arcs = targetCountries.map((feature) => ({
            sourcePosition: originCountry?.geometry.coordinates,
            targetPosition: feature.geometry.coordinates,
          }));

          setArcs(arcs);
        },
      }),
    ],
    [countryCapitalsGeojson, countryLimitsGeojson]
  );

  const arcLayer = useMemo(
    () =>
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
      />
    </div>
  );
}
