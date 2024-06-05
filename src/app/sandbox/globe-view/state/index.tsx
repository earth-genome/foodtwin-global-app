import React from "react";
import { createActorContext } from "@xstate/react";
import { globeViewMachine } from "./machine";
import { createBrowserInspector } from "@statelyai/inspect";

const inspector = createBrowserInspector();

export const MachineContext = createActorContext(
  globeViewMachine,
  process.env.NODE_ENV !== "production"
    ? {
        inspect: inspector.inspect,
      }
    : undefined
);

export function MachineProvider(props: { children: React.ReactNode }) {
  return <MachineContext.Provider>{props.children}</MachineContext.Provider>;
}
