import {
  CountryCapitalsGeoJSON,
  CountryLimitsGeoJSON,
} from "@/types/countries";
import { assign, createMachine, assertEvent, fromPromise } from "xstate";

export const globeViewMachine = createMachine(
  {
    /** @xstate-layout N4IgpgJg5mDOIC5RQDYHsBGYBqBLMA7gHQCyAhgA4AEusV6ZEuAdlAMQRrNhEsBuaANY8AZmAAuAYwAW5CgBEy4sgG0ADAF1EoCmli5xuLtpAAPRAEYALAFYiAThsB2J-YAc9gGxqATF4DMTgA0IACeiAC0bhZE-jZuTv7+9u5uVm7+VgC+WSGomDj4xHI0dAxMrGxgAE7VaNVEFChKIvUAtkRiUrKUisrqWkgguvqGxkPmCMluRBY2VmrWFvZWPpkWIeEIERZunkRONn7RLnE+Pp6eOXnoWHiERACSzAa4ZChU+VhUfEVsAMpgFBgSTiKhkapgVSaEwjV7jUCTNSbRBqa4gL6FB4AYTQAFdmOJqqFSlRYECQeJIGxscCIeDIWQyRTQUZmANYXp4cwTEiUQg0bkMbcscRcQSiSTaMzgaDqYDZWCIVCOUM4WMeRNIv41ERPPZrGorPYfK5PLZTfyrBYnEQrFYktavJ4-D5skLMfdiAAFMgwUltfGEljsX3+6RkOiBiWQVU6Lka3mWWx2zwWQILNxpE2+fkRHUzfwZOIm2zufwWHJC5hoCBwEyeoqc0ZspPbJwzfWG42mry2fx59IzNbWLNqOL2xLoxsPErS8oh5vcttOKx6qwu+xnCxqRIrPM+CwxNzxFw2LwWQ+Vj0ir1PF6Gd6fEU-JtqhOtrUIOb+IjRfz6moQEdm6-KOH+q6eB2HhFrs0TTreRREOKhLEqS5KKpAS6Jl+FjeAc45xJcZ5dvySQxFu5xOD4ajeOOThXDeBR3gAqtwpgUJSkBUDUdTVNhn6IogdGzCsiw2EciwrAOYSRHBRA2LslHxMaUE2IxNzMUhYZgAGQaGKwAkImYlhHEQtELDqW7uE44mDos5n2jRajOPMyzujkQA */
    id: "globeView",

    types: {
      context: {} as {
        areaId: string | null;
        countryLimitsGeoJSON: CountryLimitsGeoJSON | null;
        countryCapitalsGeoJSON: CountryCapitalsGeoJSON | null;
      },
      events: {} as
        | {
            type: "Page has mounted";
            context: {
              areaId: string | null;
            };
          }
        | {
            type: "Select area";
            areaId: string;
          }
        | {
            type: "Clear area selection";
          },
      actions: {} as
        | {
            type: "initContext";
            context: {
              areaId: string | null;
            };
          }
        | {
            type: "setAreaId";
            areaId: string;
          }
        | {
            type: "clearAreaId";
          }
        | {
            type: "assignMapData";
            countryLimitsGeojson: CountryLimitsGeoJSON;
            countryCapitalsGeojson: CountryCapitalsGeoJSON;
          },
    },

    context: {
      areaId: null,
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
          "Select area": {
            target: "Country is selected",
            actions: "setAreaId",
          },
        },
      },

      "Country is selected": {
        on: {
          "Clear area selection": {
            target: "Initial globe view",
            actions: "clearAreaId",
          },

          "Select area": {
            target: "Country is selected",
            actions: "setAreaId",
          },
        },
      },

      "Unexpected error": {},

      "Page is mounting": {
        on: {
          "Page has mounted": {
            target: "Map is loading",
            reenter: true,
            actions: "initContext",
          },
        },
      },
    },

    initial: "Page is mounting",
  },
  {
    actions: {
      initContext: assign(({ event }) => {
        assertEvent(event, "Page has mounted");
        return {
          ...event.context,
        };
      }),
      setAreaId: assign(({ event }) => {
        assertEvent(event, "Select area");
        return {
          areaId: event.areaId,
        };
      }),
      clearAreaId: assign({
        areaId: undefined,
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
