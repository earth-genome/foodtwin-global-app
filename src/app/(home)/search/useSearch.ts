import { EItemType } from "@/types/components";
import { IResult } from "@/types/data";
import { useEffect, useState } from "react";

function useSearch(q?: string) {
  const [results, setResults] = useState<IResult[]>();

  useEffect(() => {
    if (!q || q.length < 3) {
      setResults(undefined);
      return;
    }

    setResults([
      {
        id: "DEU.16_1",
        label: "Thüringen",
        type: EItemType["area"],
      },
      {
        id: "NED.16_1",
        label: "Rotterdam",
        type: EItemType["node"],
      },
    ]);
  }, [q]);

  return {
    results,
  };
}

export default useSearch;
