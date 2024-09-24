import { createActorContext } from "@xstate/react";
import { globeViewMachine } from "./machine";

export const MachineContext = createActorContext(globeViewMachine, {
  inspect:
    process.env.NEXT_PUBLIC_XSTATE_INSPECT === "true"
      ? (inspectEvent) => {
          if (
            inspectEvent.type !== "@xstate.event" &&
            inspectEvent.type !== "@xstate.snapshot"
          )
            return;

          console.groupCollapsed(
            "%c event",
            "color: gray; font-weight: lighter;",
            inspectEvent.type
          );

          if (inspectEvent.type === "@xstate.event") {
            console.log(
              "%c event",
              "color: #03A9F4; font-weight: bold;",
              inspectEvent.event
            );
          } else if (inspectEvent.type === "@xstate.snapshot") {
            console.log(
              "%c state",
              "color: #4CAF50; font-weight: bold;",
              inspectEvent.snapshot
            );
          }
          console.groupEnd();
        }
      : undefined,
});

export function MachineProvider(props: { children: React.ReactNode }) {
  return <MachineContext.Provider>{props.children}</MachineContext.Provider>;
}
