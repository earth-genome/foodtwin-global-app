"use client";
import Map, { Layer, Source } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";

function MapboxTest() {
  return (
    <Map
      mapboxAccessToken="pk.eyJ1IjoiZGV2c2VlZCIsImEiOiJjbHo5NWh0d3QwMDU0MnBvanAwMmRzYWl0In0.lLN2Ur91TbYhV520kQ3SrA"
      initialViewState={{
        longitude: 0,
        latitude: 0,
        zoom: 2,
      }}
      style={{ width: 1000, height: 800 }}
      mapStyle="mapbox://styles/mapbox/light-v11"
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
