"use client";
import { useState } from "react";
import Image from "next/image";
import { Button, Link, LinkProps } from "@nextui-org/react";
import { List, X } from "@phosphor-icons/react/dist/ssr";

function MenuLink({ children, href, ...props }: LinkProps) {
  return (
    <Link
      href={href}
      {...props}
      className="text-brand-200 uppercase font-header"
    >
      {children}
    </Link>
  );
}

function Menu() {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const leftPosition = isOpen ? "left-0" : "left-[-100vw]";

  const toggle = () => setIsOpen((prev) => !prev);

  return (
    <div
      className={`absolute top-0 ${leftPosition} bottom-0 bg-white/50 z-50 flex transition-left overflow-hidden`}
    >
      <div
        className="bg-neutral-900 w-screen h-screen flex-shrink-0 flex items-center gap-4 p-4 box-border"
        aria-hidden={!isOpen}
      >
        <div className="flex-grow pl-24">
          <Image
            src="/logos/portrait.svg"
            alt="Food Twin"
            width="59"
            height="70"
          />
          <nav>
            <ul className="flex gap-12 mt-8">
              <li>
                <MenuLink href="/flows">Flows</MenuLink>
              </li>
              <li>
                <MenuLink href="/disruptions">Disruptions</MenuLink>
              </li>
              <li>
                <MenuLink href="/insights">Insights</MenuLink>
              </li>
              <li>
                <MenuLink href="/about">About</MenuLink>
              </li>
            </ul>
          </nav>
        </div>
        <div>
          <Button
            isIconOnly
            variant="light"
            aria-label="Close menu"
            radius="full"
            onClick={toggle}
          >
            <X className="text-neutral-400" size={24} />
          </Button>
        </div>
      </div>
      <div
        className={`${isOpen ? "hidden" : "grid"} grid-rows-[max-content_1fr] gap-2 h-screen flex-shrink-0 p-2 box-border`}
        aria-hidden={isOpen}
      >
        <div className="text-center">
          <Image
            src="/logos/landscape.svg"
            alt="Food Twin"
            width="88"
            height="44"
          />
          <p className="text-xxs mt-1">by The Plotline</p>
        </div>
        <div className="text-center self-center">
          <Button
            isIconOnly
            variant="light"
            aria-label="Show menu"
            onClick={toggle}
          >
            <List size={32} />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default Menu;
