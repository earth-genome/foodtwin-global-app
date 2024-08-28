import Menu from "../components/Menu";
import Globe from "./globe";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Menu />
      <div className="flex h-screen">
        <Globe />
        {children}
      </div>
    </>
  );
}
