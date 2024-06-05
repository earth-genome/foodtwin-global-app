"use client";

import GlobePanel from "./components/globe-panel";
import { CountryCard } from "./components/country-card";
import { MachineContext, MachineProvider } from "./state";
import { Button } from "@nextui-org/react";
import { selectors } from "./state/selectors";

function InnerPage() {
  const actorRef = MachineContext.useActorRef();

  const displaySidePanel = MachineContext.useSelector((state) =>
    state.context.selectedCountryId ? true : false
  );

  const mapIsLoading = MachineContext.useSelector((state) =>
    state.matches("Map is loading")
  );
  const currentCountryLimit = MachineContext.useSelector(
    selectors.currentCountryLimit
  );

  if (mapIsLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        Loading...
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      <div className="flex-1 bg-gray-100 flex items-center justify-center">
        <GlobePanel />
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
          {currentCountryLimit && (
            <CountryCard
              key={currentCountryLimit.properties.id}
              {...currentCountryLimit?.properties}
            />
          )}
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
