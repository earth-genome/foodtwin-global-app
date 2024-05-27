"use client";

import { useEffect, useState } from "react";
import GlobePanel from "./components/globe-panel";
import {
  CountryCapitalsGeoJSON,
  CountryLimitsGeoJSON,
} from "@/types/countries";

export default function Page() {
  const [countryLimitsGeojson, setCountryLimitsGeojson] =
    useState<CountryLimitsGeoJSON | null>(null);

  const [countryCapitalsGeojson, setCountryCapitalsGeojson] =
    useState<CountryCapitalsGeoJSON | null>(null);

  useEffect(() => {
    // Fetch the JSON data from the public directory
    fetch("/naturalearth-3.3.0/ne_50m_admin_0_countries.geojson")
      .then((response) => response.json() as Promise<CountryLimitsGeoJSON>)
      .then((data) =>
        setCountryLimitsGeojson({
          ...data,
          features: data.features.map((feature) => ({
            ...feature,
            properties: {
              ...feature.properties,
              id: feature.properties.iso_a2,
            },
          })),
        })
      );

    fetch("/naturalearth-3.3.0/ne_50m_populated_places_adm0cap.geojson")
      .then((response) => response.json() as Promise<CountryCapitalsGeoJSON>)
      .then((data) =>
        setCountryCapitalsGeojson({
          ...data,
          features: data.features.map((feature) => ({
            ...feature,
            properties: {
              ...feature.properties,
              id: feature.properties.ISO_A2,
            },
          })),
        })
      );
  }, []);

  if (!countryLimitsGeojson || !countryCapitalsGeojson) {
    return (
      <div className="flex items-center justify-center h-screen">
        Loading...
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      <div className="flex-1 bg-gray-100 flex items-center justify-center">
        <GlobePanel
          countryLimitsGeojson={countryLimitsGeojson}
          countryCapitalsGeojson={countryCapitalsGeojson}
        />
      </div>
      <div className="overflow-y-auto w-128 p-4 space-y-4">
        {countryLimitsGeojson?.features.map(
          ({
            properties: {
              name,
              sovereignt,
              admin,
              continent,
              region_un,
              subregion,
              pop_est,
              gdp_md_est,
              economy,
              income_grp,
              wikipedia,
            },
          }) => (
            <div key={name} className="p-4 bg-white shadow-md rounded-lg">
              <h2>{name}</h2>
              <table>
                <tbody>
                  <tr>
                    <td>Sovereignty:</td>
                    <td>{sovereignt}</td>
                  </tr>
                  <tr>
                    <td>Admin:</td>
                    <td>{admin}</td>
                  </tr>
                  <tr>
                    <td>Continent:</td>
                    <td>{continent}</td>
                  </tr>
                  <tr>
                    <td>UN Region:</td>
                    <td>{region_un}</td>
                  </tr>
                  <tr>
                    <td>Subregion:</td>
                    <td>{subregion}</td>
                  </tr>
                  <tr>
                    <td>Population Estimate:</td>
                    <td>{pop_est}</td>
                  </tr>
                  <tr>
                    <td>GDP Estimate (in million USD):</td>
                    <td>{gdp_md_est}</td>
                  </tr>
                  <tr>
                    <td>Economy:</td>
                    <td>{economy}</td>
                  </tr>
                  <tr>
                    <td>Income Group:</td>
                    <td>{income_grp}</td>
                  </tr>
                  <tr>
                    <td>Wikipedia:</td>
                    <td>{wikipedia}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )
        )}
      </div>
    </div>
  );
}
