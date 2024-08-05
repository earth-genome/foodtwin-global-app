"use client";

import { Button } from "@nextui-org/react";
import { useRouter } from "next/navigation";

export default function CloseButton() {
  const router = useRouter();

  return (
    <Button
      variant="light"
      onPress={() => router.push("/")}
      className="absolute top-4 right-4"
    >
      Close
    </Button>
  );
}
