import { NextUIProvider } from "@nextui-org/react";
import PlausibleProvider from "next-plausible";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PlausibleProvider domain={process.env.NEXT_PUBLIC_PLAUSIBLE_URL || ""}>
      <NextUIProvider>{children}</NextUIProvider>
    </PlausibleProvider>
  );
}
