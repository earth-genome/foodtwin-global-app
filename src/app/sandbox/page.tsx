import React from "react";
import LinkButton from "../components/link-button";

const currentPages = [
  { href: "/about", label: "About" },
  { href: "/sandbox/simple-map", label: "Simple Map" },
  { href: "/sandbox/mvt-test", label: "MVT View" },
];

export default function Page() {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="flex space-x-4">
        {currentPages.map((page) => (
          <LinkButton key={page.href} href={page.href}>
            {page.label}
          </LinkButton>
        ))}
      </div>
    </div>
  );
}
