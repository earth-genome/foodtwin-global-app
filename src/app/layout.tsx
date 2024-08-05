import React from "react";
import RootLayout from "./root-layout";
import Globe from "./globe";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <RootLayout>
      <div className="flex h-screen">
        <Globe />
        {children}
      </div>
    </RootLayout>
  );
}
