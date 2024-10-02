import { useEffect, useState } from "react";
import { IResult } from "@/types/data";
import { useDebounce } from "@/utils/hooks";

function useSearch(q?: string) {
  const [results, setResults] = useState<IResult[]>();
  const [error, setError] = useState<string>();
  const [isPending, setIsPending] = useState<boolean>(false);

  const debouncedQuery = useDebounce(q, 300);

  useEffect(() => {
    setError(undefined);
    setIsPending(true);
  }, [q]);

  useEffect(() => {
    if (!debouncedQuery) {
      setResults(undefined);
      return;
    }

    if (debouncedQuery.length > 0 && debouncedQuery.length < 3) {
      setResults(undefined);
      setError("Enter at least 3 letters to start searching.");
      return;
    }

    const controller = new AbortController();
    fetch(`/api/search?q=${debouncedQuery}`, { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) {
          const { error: e } = await res.json();
          throw new Error(e);
        }
        return res;
      })
      .then((res) => res.json())
      .then(setResults)
      .catch((e) => setError(e.message))
      .finally(() => setIsPending(false));

    return () => {
      controller.abort();
    };
  }, [debouncedQuery]);

  return {
    results,
    error,
    isPending,
  };
}

export default useSearch;
