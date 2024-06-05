import { assign, createMachine, assertEvent } from "xstate";

export const globeViewMachine = createMachine(
  {
    /** @xstate-layout N4IgpgJg5mDOIC5RQDYHsBGYBqBLMA7gHQAKAhjAAS6yVkDG9cskAxACJj0DWRqlBMrXRkIkANoAGALqJQABzSxcAF1xoAdnJAAPRAEZ9ADiIBWACz6AbPoCcAJkn3bLgOymANCACeiALT69kT2+q5WjqYOYZIAzKamAL4JXqiYOPjEAJIaqrhkKJSpWJQAbhmsAMpgKFwqlPRoAK4aKgBO3lKySCCKymqa2noIfqaSRDb2pvrmppPWpq62Xr4IgbZErjHm5q7mcTGSRjGuRkkp6Fh4hEQAwk0t7dS0LDX0Kmw3NWSt9fdt3pQXrV1BpOtperkBt0hvYrFYNvt7DEjLZ9JJdkZlgZnAjtrt9odjqcziANGgxPBukV0oRwUpIVpof5bCYJlMZnMrAslj5-PMiJJLIt7PY9qLUcTzmkrsRyFQaHRGMxIHS+iDBtiTE5YUcrOZJLZzKKYljhq5XEQjBZzC5BYtwuESdSZURsrl8oULmBShlVQyNasDkQ0ZJItZYQdQqbZsEYnGLLY4zFHDsnV6XXdmv8noDqrUVd0If1GaAhoExiK9a4Qui4p5eQhJutFrs4UZ9SKYomkkkgA */
    id: "globeView",

    types: {
      context: {} as {
        selectedCountryId: string | undefined;
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
          },
    },

    context: {
      selectedCountryId: undefined,
    },

    states: {
      "Page is accessed": {
        on: {
          "Deck.gl was loaded": "Initial globe view",
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
  }
);
