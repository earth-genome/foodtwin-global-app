import {
  CountryCapitalsGeoJSON,
  CountryLimitsGeoJSON,
} from "@/types/countries";
import { assign, createMachine, assertEvent, fromPromise } from "xstate";

export const globeViewMachine = createMachine(
  {
    /** @xstate-layout N4IgpgJg5mDOIC5RQDYHsBGYBqBLMA7gHQAKAhjAAS6yVkDG9cskAxBGgHZhG6cBuaANY8AZmAAu9ABYBZMgAcAImQlkA2gAYAuolAK0sXBNxc9IAB6IAjABYArEQCc9gOyuAHADYAzE9seAEzBHgA0IACeiK5Eml7Wrj6uvtY+qU5eAL6Z4aiYOPjE5FQ0dIzMbGAATlVoVUQKKKqidQC2ROJScooqalq6SCAGRiZmg1YIfk5E9rbxPoFpPh5OGeFRCAC0TjELSfaa1h6aC-Ze9tm56Fh4hEQAkpzGuGQolHlYlPyFrADKYCgwPQJJR6GgAK6cCRVCL9czDZ5jUATOyaZxeJwJVyaDweTxeLyudY2JxotynQKaDL2HxxVyXEAfAp3ADCEKhMOotBYgOBbBZgLIVVB7OhEUoPKBo04cMGCOl5gmPnsHlitgCHms1nsmK8OOJCGspJmiUC9kp1NphOyORAnDQEDg5iZtwI8MMiM4isQPlssTxK00Z2sgSC+siiE2FqI8S8HiSOKSticKwZLsKpAoYC5ZSYsBYEHdI1MXvGiCC-s8pODocpYQjWxDgSItkCLlmKqSx2TaeuzOIj2er3efa+hSLnu9hppRE1PgxmkXnkCtgNLlnrjmnhWyyOmt7+VdRDZkLFOclfMLco9CrLhr1RGxPmVBPcZ0xBuf1mcC0CrkpeonMkB43BmACq3AWAoUqQJQ1S1FUE63siiAqtMrYrpoDhaiseIGts0w4hkqytoS3i+jamRAA */
    id: "globeView",

    types: {
      context: {} as {
        selectedCountryId: string | undefined;
        countryLimitsGeoJSON: CountryLimitsGeoJSON | undefined;
        countryCapitalsGeoJSON: CountryCapitalsGeoJSON | undefined;
      },
      events: {} as
        | {
            type: "Deck.gl was loaded";
          }
        | {
            type: "Select country";
            countryId: string;
          }
        | {
            type: "Clear country selection";
          },
      actions: {} as
        | {
            type: "setSelectedCountryId";
            countryId: string;
          }
        | {
            type: "clearSelectedCountryId";
          }
        | {
            type: "assignMapData";
            countryLimitsGeojson: CountryLimitsGeoJSON;
            countryCapitalsGeojson: CountryCapitalsGeoJSON;
          },
    },

    context: {
      selectedCountryId: undefined,
      countryLimitsGeoJSON: undefined,
      countryCapitalsGeoJSON: undefined,
    },

    states: {
      "Page is accessed": {
        invoke: {
          id: "fetchMapData",
          src: "fetchMapData",
          onError: {
            target: "Unexpected error",
          },
          onDone: {
            target: "Initial globe view",
            actions: assign({
              countryLimitsGeoJSON: ({ event }) =>
                event.output.countryLimitsGeojson,
              countryCapitalsGeoJSON: ({ event }) =>
                event.output.countryCapitalsGeojson,
            }),
          },
        },
      },

      "Initial globe view": {
        on: {
          "Select country": {
            target: "Country is selected",
            actions: "setSelectedCountryId",
          },
        },
      },

      "Country is selected": {
        on: {
          "Clear country selection": {
            target: "Initial globe view",
            actions: "clearSelectedCountryId",
          },
        },
      },

      "Unexpected error": {},
    },

    initial: "Page is accessed",
  },
  {
    actions: {
      setSelectedCountryId: assign(({ event }) => {
        assertEvent(event, "Select country");
        return {
          selectedCountryId: event.countryId,
        };
      }),
      clearSelectedCountryId: assign({
        selectedCountryId: undefined,
      }),
    },
    actors: {
      fetchMapData: fromPromise(async () => {
        const countryLimitsGeojson = await fetch(
          "/naturalearth-3.3.0/ne_50m_admin_0_countries.geojson"
        )
          .then((response) => response.json() as Promise<CountryLimitsGeoJSON>)
          .then((data) => ({
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
          }));

        const countryCapitalsGeojson = await fetch(
          "/naturalearth-3.3.0/ne_50m_populated_places_adm0cap.geojson"
        )
          .then(
            (response) => response.json() as Promise<CountryCapitalsGeoJSON>
          )
          .then((data) => ({
            ...data,
            features: data.features.map((feature) => ({
              ...feature,
              properties: {
                ...feature.properties,
                id: feature.properties.ISO_A2,
              },
            })),
          }));

        return {
          countryLimitsGeojson,
          countryCapitalsGeojson,
        };
      }),
    },
  }
);
