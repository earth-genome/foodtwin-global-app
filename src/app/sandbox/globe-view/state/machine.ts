import {
  CountryCapitalsGeoJSON,
  CountryLimitsGeoJSON,
} from "@/types/countries";
import { assign, createMachine, assertEvent, fromPromise } from "xstate";

export const globeViewMachine = createMachine(
  {
    /** @xstate-layout N4IgpgJg5mDOIC5RQDYHsBGYBqBLMA7gHQCyAhgA4AEusV6ZEuAdlAMQRrNhEsBuaANY8AZmAAuAYwAW5CgBEy4sgG0ADAF1EoCmli5xuLtpAAPRAEYALAFYiAThsB2J-YAc9gGxqATF4DMTgA0IACeiAC0bhZE-jZuTv7+9u5uVm7+VgC+WSGomDj4xHI0dAxMrGxgAE7VaNVEFChKIvUAtkRiUrKUisrqWkgguvqGxkPmCMluRBY2VmrWFvZWPpkWIeEIERZunkRONn7RLnE+Pp6eOXnoWHiERACSzAa4ZChU+VhUfEVsAMpgFBgSTiKiSNAAV2Y4mqoQGJhGr3GoEm1jUDk89gsLjUbgSe08wTClnsGOc-h8RzUXhs-jUROuIC+hQeAGEoTC4aUqLAgSDxJA2GzgWRquDObDQrz+aCjMwEUMkWNmCZJnEZmorOlonNsd43JtSeTElSfDTPHSGU4mSz7sQOdCpTy+cDQULAW6wRCnXDFTo9MjVRNIvZ-EQ1P4LJ5-J4fFZPFZ7E5o0aEDinERLY54ykFlHskzmGgIHATHaiojAyq1ZElhGozG4wmkynPGmIn57BGEwyFhY4lYnJdbbdWcVKDzyiwoFXRvLawgnFYswm-GcLGpEisOz4LDE3PEXDYvBY9xZRwV7U8XoZ3p8xz9K0rqwuQ+m6URorGyWot254zTRwv2XIl8TDaJ8QvXJmTHa9HS5aVaBlL1IDnINF2jDEnEjOJLmPLENhJKYowcSkfCcc1vEjYdLzuIoiAAVW4UwKAFSAqBqOpqnQmt32o2YVkWGxqWWKx-A7XYZhsXYwypNIvEOK4ciyIA */
    id: "globeView",

    types: {
      context: {} as {
        selectedCountryId: string | null;
        countryLimitsGeoJSON: CountryLimitsGeoJSON | null;
        countryCapitalsGeoJSON: CountryCapitalsGeoJSON | null;
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
      selectedCountryId: null,
      countryLimitsGeoJSON: null,
      countryCapitalsGeoJSON: null,
    },

    states: {
      "Map is loading": {
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

          "Select country": {
            target: "Initial globe view",
            reenter: true,
            actions: "setSelectedCountryId",
          },
        },
      },

      "Unexpected error": {},
    },

    initial: "Map is loading",
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
