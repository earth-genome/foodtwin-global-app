import { IResult } from "@/types/data";
import { useEffect, useState } from "react";

function useSearch(q?: string) {
  const [results, setResults] = useState<IResult[]>();
  const [error, setError] = useState<string>();

  useEffect(() => {
    setError(undefined);

    if (!q) {
      setResults(undefined);
      return;
    }

    if (q.length > 0 && q.length < 3) {
      setResults(undefined);
      setError("Enter at least 3 letters to start searching.");
      return;
    }

    fetch(`/api/search?q=${q}`)
      .then(async (res) => {
        if (!res.ok) {
          const { error: e } = await res.json();
          throw new Error(e);
        }
        return res;
      })
      .then((res) => res.json())
      .then(setResults)
      .catch((e) => setError(e.message));
  }, [q]);

  return {
    results,
    error,
  };
}

export default useSearch;
