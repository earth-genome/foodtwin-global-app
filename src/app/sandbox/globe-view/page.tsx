"use client";

import generateLoremIpsum from "../../_utils/generate-lorem-ipsum";
import GlobePanel from "./components/globe-panel";

export default function Page() {
  const cards = new Array(10).fill(null).map((_, index) => ({
    title: generateLoremIpsum(3),
    content: (
      <>
        <p key={`lorem-${index}`}>{generateLoremIpsum(50)}</p>
      </>
    ),
  }));

  return (
    <div className="flex h-screen">
      <div className="flex-1 bg-gray-100 flex items-center justify-center">
        <GlobePanel />
      </div>
      <div className="overflow-y-auto w-128 p-4 space-y-4">
        {cards.map((card) => (
          <div
            key={card.title}
            className="h-3/4 p-4 bg-white shadow-md rounded-lg"
          >
            <h4 className="font-bold mb-2">{card.title}</h4>
            {card.content}
          </div>
        ))}
      </div>
    </div>
  );
}
