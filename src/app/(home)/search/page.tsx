"use client";
import { MagnifyingGlass } from "@phosphor-icons/react/dist/ssr";
import { useState } from "react";

function SearchPage() {
  const [value, setValue] = useState<string>("");
  const [showPlaceholder, setShowPlaceHolder] = useState<boolean>(true);

  const togglePlaceholder = () => {
    setShowPlaceHolder((prev) => !prev);
  };

  return (
    <div className="absolute top-0 left-0 z-40 h-screen w-screen bg-neutral-100/50 backdrop-blur">
      <div className="max-w-[700px] mx-auto py-20 box-border h-screen overflow-auto">
        <div className="flex items-center gap-4 border-b pb-2 border-neutral-600">
          <input
            type="text"
            aria-label="Enter any region, county or port name"
            placeholder={
              showPlaceholder
                ? "Enter any region, county or port name"
                : undefined
            }
            className="w-full text-3xl text-neutral-500 outline-none"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onFocus={togglePlaceholder}
            onBlur={togglePlaceholder}
            style={{
              backgroundColor: "transparent",
            }}
          />
          <MagnifyingGlass size={20} className="text-neutral-700" />
        </div>
      </div>
    </div>
  );
}

export default SearchPage;
