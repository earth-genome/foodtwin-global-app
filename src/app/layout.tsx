import { NextUIProvider } from "@nextui-org/react";
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
      <body>
        <NextUIProvider>{children}</NextUIProvider>
      </body>
    </html>
  );
}
