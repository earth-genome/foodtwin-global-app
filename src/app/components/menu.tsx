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
        className="w-screen h-screen flex-shrink-0 flex gap-4 box-border bg-neutral-100/50 backdrop-blur"
        aria-hidden={!isOpen}
      >
        <div className="flex-grow">
          <div className="max-w-128 mx-auto pt-12">
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
              <Tab key="flows" title="Food flows">
                <p>
                  Lorem ipsum dolor sit amet consectetur. Felis vulputate etiam
                  cras odio cras tellus habitant urna sociis. Donec tristique
                  etiam est venenatis pharetra et eu vel ipsum. Platea sed
                  faucibus dictum in. Massa consectetur semper neque orci at in
                  donec egestas posuere. Arcu enim vulputate accumsan vitae ac
                  placerat vivamus platea pulvinar. Augue vel tellus at iaculis.
                </p>
                <Button
                  onClick={() => setIsOpen(false)}
                  className="mt-4 font-header bg-accent-warm-400 text-white rounded"
                >
                  Explore Food Flows
                </Button>
              </Tab>
              <Tab key="disruptions" title="Disruptions" isDisabled>
                Disruptions
              </Tab>
              <Tab key="about" title="About">
                <p>
                  Lorem ipsum dolor sit amet consectetur. Felis vulputate etiam
                  cras odio cras tellus habitant urna sociis. Donec tristique
                  etiam est venenatis pharetra et eu vel ipsum. Platea sed
                  faucibus dictum in. Massa consectetur semper neque orci at in
                  donec egestas posuere. Arcu enim vulputate accumsan vitae ac
                  placerat vivamus platea pulvinar. Augue vel tellus at iaculis.
                </p>
              </Tab>
            </Tabs>
          </div>
        </div>
        <div className="border-l-1 border-ink/10 p-4 flex">
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
