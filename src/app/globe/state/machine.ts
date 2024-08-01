import {
  CountryCapitalsGeoJSON,
  CountryLimitsGeoJSON,
} from "@/types/countries";
import { assign, createMachine, assertEvent, fromPromise } from "xstate";

export const globeViewMachine = createMachine(
  {
    /** @xstate-layout N4IgpgJg5mDOIC5RQDYHsBGYBqBLMA7gHQCyAhgA4AEusV6ZEuAdlAMQRrNhEsBuaANY8AZmAAuAYwAW5CgBEy4sgG0ADAF1EoCmli5xuLtpAAPRAEYALAFYiAThsB2J-YAc9gGxqATF4DMTgA0IACeiAC0bhZE-jZuTv7+9u5uVm7+VgC+WSGomDj4xHI0dAxMrGxgAE7VaNVEFChKIvUAtkRiUrKUisrqWkgguvqGxkPmCMluRBY2VmrWFvZWPpkWIeEIERZunkRONn7RLnE+Pp6eOXnoWHiERACSzAa4ZChU+VhUfEVsAMpgFBgSTiKiSNAAV2Y4mqoQGJhGr3GoEm1jUDk89gsLjUbgSe08wTClnsGOc-h8RzUXhs-jUROuIC+hQeAGEoTC4aUqLAgSDxJA2GzgWRquDObDQrz+aCjMwEUMkWNmCZJnEZmorOlonNsd43JtSeTElSfDTPHSGU4mSz7sQOdCpTy+cDQULAW6wRCnXDFTo9MjVRNImsiAykhZPJHzm4LjYjQgrBZ-OGtWotfZ-JaoxYcrkQMw0BA4CY7UVEYGVWrIk4YhH-FGYz4455ExE-PZw1ZvJ4Fin5k5LrbbqzipQeeUWFBK6N5TWEE4rEQ+54-GcLGpEit2z4LDE3PEXDYvBY93mC+WHs9Xu9PqOfhWlVX5yGEHNU9Fs2SM0441ZE0cIgEh7P8PH8aJ8QvG4CntIhHS5aVaBlL1IFnIMFyjDEnDUJIbEuY8sQ2EkpkbBxKR8JxzW8XChxHWCiiIABVbhTAoAVICoGo6mqdDqzfGjZhWRYbGpZYrH8dtdhmGxdizKk0i8Q4rnzIA */
    id: "globeView",

    types: {
      context: {} as {
        selectedCountryId: string | null;
        countryLimitsGeoJSON: CountryLimitsGeoJSON | null;
        countryCapitalsGeoJSON: CountryCapitalsGeoJSON | null;
      },
      events: {} as
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
            target: "Country is selected",
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
