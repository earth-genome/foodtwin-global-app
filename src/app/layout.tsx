import { NextUIProvider } from "@nextui-org/react";
import PlausibleProvider from "next-plausible";
import { Lexend_Exa, Merriweather } from "next/font/google";

const lexend = Lexend_Exa({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-lexend",
});

const merriweather = Merriweather({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-merriweather",
  weight: ["400", "700"],
});

import "./globals.css";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${lexend.variable} ${merriweather.variable} font-body`}
    >
      <head>
        <PlausibleProvider
          domain={process.env.NEXT_PUBLIC_PLAUSIBLE_URL || ""}
        />
      </head>
      <body>
        <NextUIProvider>{children}</NextUIProvider>
      </body>
    </html>
  );
}
