"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";

// Xstate
import { MachineContext, MachineProvider } from "./state";
import { selectors } from "./state/selectors";

// Components
import { Button } from "@nextui-org/react";
import GlobePanel from "./components/globe-panel";
import { CountryCard } from "./components/country-card";

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

export default function Globe() {
  return (
    <MachineProvider>
      <InnerPage />
    </MachineProvider>
  );
}
