import { Button } from "@nextui-org/react";
import Link from "next/link";
import { MagnifyingGlass } from "@phosphor-icons/react/dist/ssr";

const Home = () => {
  return (
    <div className="absolute right-4 top-4 z-20">
      <Button
        href="/search"
        as={Link}
        startContent={
          <MagnifyingGlass size={20} className="text-neutral-400" />
        }
        className="rounded border-neutral-600 border bg-neutral-100/60 text-neutral-800 font-header text-xs tracking-tight"
      >
        Search the map
      </Button>
    </div>
  );
};

export default Home;
