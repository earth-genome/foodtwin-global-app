"use client";

import { useEffect, useState } from "react";
import GlobePanel from "./components/globe-panel";
import {
  CountryCapitalsGeoJSON,
  CountryLimitsGeoJSON,
} from "@/types/countries";
import { CountryCard } from "./components/country-card";
import { MachineContext, MachineProvider } from "./state";
import { Button } from "@nextui-org/react";

function InnerPage() {
  const actorRef = MachineContext.useActorRef();

  const displaySidePanel = MachineContext.useSelector((state) =>
    state.matches("Country is selected")
  );

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
          features: data.features
            .map((feature) => ({
              ...feature,
              properties: {
                ...feature.properties,
                id: feature.properties.iso_a2,
              },
            }))
            .filter((feature) => feature.properties.id !== "-99"),
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

    actorRef.send({
      type: "Deck.gl was loaded",
    });
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
      {displaySidePanel && (
        <div className="overflow-y-auto w-128 p-4 space-y-4">
          <Button
            isIconOnly
            aria-label="Close"
            onClick={() => actorRef.send({ type: "Clear country selection" })}
          >
            X
          </Button>
          {countryLimitsGeojson?.features.map((c) => (
            <CountryCard key={c.properties.id} {...c.properties} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Page() {
  return (
    <MachineProvider>
      <InnerPage />
    </MachineProvider>
  );
}
