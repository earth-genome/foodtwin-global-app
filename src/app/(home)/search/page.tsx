"use client";
import { MagnifyingGlass } from "@phosphor-icons/react/dist/ssr";
import { useState } from "react";
import useSearch from "./useSearch";
import Results from "./results";

function SearchPage() {
  const [value, setValue] = useState<string>("");
  const [hasFocus, setHasFocus] = useState<boolean>(false);

  const toggleFocus = () => setHasFocus((prev) => !prev);
  const { results, error } = useSearch(value);

  return (
    <div className="absolute top-0 left-0 z-40 h-screen w-screen bg-neutral-100/50 backdrop-blur">
      <div className="max-w-[700px] mx-auto py-20 box-border h-screen overflow-auto">
        <div className="flex items-center gap-4 border-b pb-2 mb-8 border-neutral-600">
          <input
            type="text"
            aria-label="Enter any region, county or port name"
            aria-invalid={!!error}
            aria-errormessage="search-error"
            placeholder={
              hasFocus ? undefined : "Enter any region, county or port name"
            }
            className={`w-full text-3xl ${hasFocus ? "text-neutral-900" : "text-neutral-500"} outline-none`}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onFocus={toggleFocus}
            onBlur={toggleFocus}
            style={{
              backgroundColor: "transparent",
            }}
          />
          <MagnifyingGlass size={20} className="text-neutral-700" />
        </div>

        {error && (
          <div id="search-error" className="text-2xl text-neutral-600">
            {error}
          </div>
        )}

        {results && <Results results={results} q={value} />}
      </div>
    </div>
  );
}

export default SearchPage;
