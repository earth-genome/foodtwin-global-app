import { type SnapshotFrom } from "xstate";
import { globeViewMachine } from "./machine";

type Snapshot = SnapshotFrom<typeof globeViewMachine>;

export const selectors = {
  pageUrl: (state: Snapshot) => {
    const { areaId } = state.context;

    return areaId ? `/area/${areaId}` : `/`;
  },
  currentCountryLimit: (state: Snapshot) => {
    const { areaId, countryLimitsGeoJSON } = state.context;

    if (!areaId || !countryLimitsGeoJSON) return null;

    return countryLimitsGeoJSON.features.find(
      (f) => f.properties.id === areaId
    );
  },
  currentCountryArcs: (state: Snapshot) => {
    const { areaId, countryCapitalsGeoJSON } = state.context;

    if (!areaId || !countryCapitalsGeoJSON) return null;

    const originCountry = countryCapitalsGeoJSON.features.find(
      (f) => f.properties.id === areaId
    );

    if (!originCountry) {
      return null;
    }

    const targetCountries = countryCapitalsGeoJSON.features
      .filter((feature) => feature.properties.id !== areaId)
      .sort(() => Math.random() - 0.5)
      .slice(0, 10);

    if (targetCountries.length === 0) {
      return null;
    }

    const arcs = targetCountries.map((feature) => ({
      sourcePosition: originCountry?.geometry.coordinates,
      targetPosition: feature.geometry.coordinates,
    }));

    return arcs;
  },
};
