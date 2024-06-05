import { type SnapshotFrom } from "xstate";
import { globeViewMachine } from "./machine";

type Snapshot = SnapshotFrom<typeof globeViewMachine>;

export const selectors = {
  currentCountryLimit: (state: Snapshot) => {
    const { selectedCountryId, countryLimitsGeoJSON } = state.context;

    if (!selectedCountryId || !countryLimitsGeoJSON) return null;

    return countryLimitsGeoJSON.features.find(
      (f) => f.properties.id === selectedCountryId
    );
  },
  currentCountryArcs: (state: Snapshot) => {
    const { selectedCountryId, countryCapitalsGeoJSON } = state.context;

    if (!selectedCountryId || !countryCapitalsGeoJSON) return null;

    const originCountry = countryCapitalsGeoJSON.features.find(
      (f) => f.properties.id === selectedCountryId
    );

    if (!originCountry) {
      return null;
    }

    const targetCountries = countryCapitalsGeoJSON.features
      .filter((feature) => feature.properties.id !== selectedCountryId)
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
