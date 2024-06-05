"use client";

import GlobePanel from "./components/globe-panel";
import { CountryCard } from "./components/country-card";
import { MachineContext, MachineProvider } from "./state";
import { Button } from "@nextui-org/react";

function InnerPage() {
  const actorRef = MachineContext.useActorRef();

  const displaySidePanel = MachineContext.useSelector((state) =>
    state.matches("Country is selected")
  );
  const countryLimitsGeojson = MachineContext.useSelector(
    (state) => state.context.countryLimitsGeoJSON
  );
  const countryCapitalsGeojson = MachineContext.useSelector(
    (state) => state.context.countryCapitalsGeoJSON
  );

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
