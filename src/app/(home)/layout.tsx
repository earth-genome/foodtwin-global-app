import Menu from "../components/menu";
import Map from "../components/map";
import WelcomeModal from "./welcome-modal";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Menu />
      <div className="flex h-screen">
        <Map />
        {children}
        <WelcomeModal />
      </div>
    </>
  );
}
