import { type SnapshotFrom } from "xstate";
import { globeViewMachine } from "./machine";

type Snapshot = SnapshotFrom<typeof globeViewMachine>;

export const selectors = {
  pageUrl: (state: Snapshot) => {
    const { areaId } = state.context;
    return areaId ? `/area/${areaId}` : `/`;
  },

  mapBounds: (state: Snapshot) => {
    return state.context.mapBounds;
  },
};
