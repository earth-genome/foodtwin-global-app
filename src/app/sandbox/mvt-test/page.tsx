"use client";
import { DeckGL } from "@deck.gl/react";
import { MapView } from "@deck.gl/core";
import type { GlobeViewState } from "@deck.gl/core";
import { MVTLayer } from "@deck.gl/geo-layers";

const INITIAL_VIEW_STATE: GlobeViewState = {
  longitude: 0,
  latitude: 0,
  zoom: 0.8,
};

export default function GlobePanel() {
  const mvtLayer = new MVTLayer({
    id: "national-centroids",
    data: "/api/tiles/{z}/{x}/{y}",
    // data: "http://naturalearthtiles.lukasmartinelli.ch/tiles/natural_earth.vector/{z}/{x}/{y}.pbf",
    getFillColor: [211, 211, 211],
    getLineWidth: 1000,
  });

  return (
    <div className="flex h-screen">
      <div className="flex-1 bg-gray-100 flex items-center justify-center">
        <div className="relative w-full h-full overflow-hidden">
          <DeckGL
            views={new MapView()}
            initialViewState={INITIAL_VIEW_STATE}
            controller={true}
            layers={[mvtLayer]}
          />
        </div>
      </div>
    </div>
  );
}
