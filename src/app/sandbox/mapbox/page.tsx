"use client";
import Map, { Layer, Source } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";

function MapboxTest() {
  return (
    <Map
      mapboxAccessToken={process.env.MAPBOX_TOKEN}
      initialViewState={{
        longitude: 0,
        latitude: 0,
        zoom: 2,
      }}
      style={{ width: 1000, height: 800 }}
      projection={{
        name: "globe",
      }}
    >
      <Source
        id="mvtiles"
        type="vector"
        tiles={["http://localhost:3000/api/tiles/{z}/{x}/{y}"]}
      >
        <Layer
          id="tile-outline"
          type="line"
          source-layer="default"
          paint={{ "line-color": "#f00", "line-width": 2 }}
        />
      </Source>
    </Map>
  );
}

export default MapboxTest;
