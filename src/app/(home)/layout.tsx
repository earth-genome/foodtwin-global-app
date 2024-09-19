import Menu from "../components/menu";
import Globe from "./globe";
import WelcomeModal from "./welcome-modal";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Menu />
      <div className="flex h-screen">
        <Globe />
        {children}
        <WelcomeModal />
      </div>
    </>
  );
}
