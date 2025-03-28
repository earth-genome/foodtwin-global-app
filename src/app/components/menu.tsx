"use client";
import { useState } from "react";
import Image from "next/image";
import { Button, Tab, Tabs } from "@nextui-org/react";
import { List, X } from "@phosphor-icons/react/dist/ssr";

function Menu() {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const leftPosition = isOpen ? "left-0" : "left-[-100vw]";

  const toggle = () => setIsOpen((prev) => !prev);

  return (
    <div
      className={`absolute top-0 ${leftPosition} bottom-0 z-50 flex transition-left overflow-hidden`}
    >
      <div
        className="w-screen h-screen flex-shrink-0 flex gap-4 box-border bg-neutral-100/50 backdrop-blur overflow-y-auto"
        aria-hidden={!isOpen}
      >
        <div className="flex-grow">
          <div className="max-w-128 mx-auto py-12">
            <Image
              src="/logos/landscape.svg"
              alt="Food Twin"
              width="88"
              height="44"
            />
            <p className="mt-4 italic text-neutral-500">
              By{" "}
              <a
                href="https://theplotline.org"
                className="text-neutral-800 underline not-italic ml-1"
              >
                The Plotline
              </a>
            </p>
            <Tabs
              variant="underlined"
              classNames={{
                tab: "font-header text-sm tracking-tighter uppercase px-0 mr-4 mt-16",
                cursor: "bg-accent-warm-400 w-[100%]",
                panel: "pt-8",
              }}
            >
              <Tab key="overview" title="Overview">
                <h2 className="mt-8 font-header text-sm tracking-wide uppercase">
                  1. Understanding Global Food Flows
                </h2>
                <p className="text-md leading-7 mt-8">
                  Food Twin Map visualizes the complex network of food
                  production and distribution across the globe. The map shows:
                </p>
                <ul className="list-disc pl-8 mt-8 space-y-1">
                  <li>Where different food groups are produced</li>
                  <li>
                    How food travels between regions through various transport
                    routes
                  </li>
                  <li>
                    The nutritional impact on populations Key economic
                    indicators related to agriculture
                  </li>
                </ul>
                <p className="text-md leading-7 mt-8">
                  The data is based on a model developed in collaboration by
                  Earth Genome and Better Planet Lab. This model incorporates
                  agricultural production statistics, trade data, and
                  transportation infrastructure to estimate global food flows.
                  You can learn more about this model here.
                </p>
                <Button
                  onClick={() => setIsOpen(false)}
                  className="mt-8 font-header bg-accent-warm-400 text-white rounded"
                >
                  Explore Food Flows
                </Button>
              </Tab>
              <Tab key="how-to-use" title="How To Use">
                <h2 className="mt-8 font-header text-sm tracking-wide uppercase">
                  2. Interacting with the Map
                </h2>
                <ul className="list-disc pl-8 mt-8 space-y-1">
                  <li>
                    Click on any region to see detailed information about food
                    production, transportation routes, and impact.
                  </li>
                  <li>
                    Navigate between views using the tab sections on area pages
                    to see:
                  </li>
                  <ul className="list-disc pl-8">
                    <li>
                      <b>Food Produced:</b> Types and quantities of food groups
                      produced in the area
                    </li>
                    <li>
                      <b>Food Transportation:</b> How food moves between regions
                      through different routes
                    </li>
                    <li>
                      <b>Impact on People:</b> Nutritional values and population
                      metrics
                    </li>
                  </ul>
                  <li>
                    Use the search button in the top right to find specific
                    regions or food groups.
                  </li>
                  <li>
                    Hover over map elements to see tooltip information about
                    areas, ports, and transport routes.
                  </li>
                </ul>
                <Button
                  onClick={() => setIsOpen(false)}
                  className="mt-8 font-header bg-accent-warm-400 text-white rounded"
                >
                  Explore Food Flows
                </Button>
              </Tab>
              <Tab key="data-insights" title="Data and Insights">
                <h2 className="mt-8 font-header text-sm tracking-wide uppercase">
                  3. Understanding the Data
                </h2>
                <p className="text-md leading-7 mt-8">
                  The Food Twin Map integrates multiple data sources to create a
                  comprehensive view of global food systems:
                </p>
                <ul className="list-disc pl-8 mt-8 space-y-1">
                  <li>
                    <b>Food Groups:</b> Categorized into major groups including
                    grains, fruits, vegetables, dairy, meat & fish, pulses,
                    oils, and more.
                  </li>
                  <li>
                    <b>Transportation Routes:</b> Shows how food moves via road,
                    rail, and waterways between producing areas and
                    destinations.
                  </li>
                  <li>
                    <b>Impact Metrics:</b> Nutritional values (calories,
                    protein, iron, vitamin A) and how they relate to population
                    needs.
                  </li>
                  <li>
                    <b>Economic Indicators:</b> GDP, agricultural sector
                    contribution, and Human Development Index for context.
                  </li>
                </ul>
                <p className="text-md mt-8">
                  The underlying flow model was developed using methodology that
                  estimates food movement patterns based on production capacity,
                  infrastructure, and trade relationships. You can learn more
                  about the model here.
                </p>
                <Button
                  onClick={() => setIsOpen(false)}
                  className="mt-8 font-header bg-accent-warm-400 text-white rounded"
                >
                  Explore Food Flows
                </Button>
              </Tab>
            </Tabs>
          </div>
        </div>
        <div className="border-l-1 border-ink/10 p-4 flex sticky top-0">
          <div className="m-auto">
            <Button
              isIconOnly
              variant="light"
              aria-label="Close menu"
              radius="full"
              onClick={toggle}
            >
              <X className="text-neutral-900" size={24} />
            </Button>
          </div>
        </div>
      </div>
      <div
        className={`${isOpen ? "hidden" : "grid"} grid-rows-[max-content_1fr] gap-2 h-screen flex-shrink-0 p-2 box-border border-r-1 border-ink/10`}
        aria-hidden={isOpen}
      >
        <div className="text-center">
          <Image
            src="/logos/portrait.svg"
            alt="Food Twin"
            width="59"
            height="70"
          />
        </div>
        <div className="text-center self-center">
          <Button
            isIconOnly
            variant="light"
            aria-label="Show menu"
            onClick={toggle}
          >
            <List className="text-neutral-900" size={32} />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default Menu;
