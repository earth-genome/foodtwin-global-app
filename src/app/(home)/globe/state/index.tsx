import { createActorContext } from "@xstate/react";
import { globeViewMachine } from "./machine";
import { createBrowserInspector } from "@statelyai/inspect";

export const MachineContext = createActorContext(
  globeViewMachine,
  process.env.NEXT_PUBLIC_USE_STATELY_INSPECTOR === "true"
    ? {
        inspect: createBrowserInspector().inspect,
      }
    : undefined
);

export function MachineProvider(props: { children: React.ReactNode }) {
  return <MachineContext.Provider>{props.children}</MachineContext.Provider>;
}
