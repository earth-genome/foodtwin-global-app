import Globe from "./globe";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen">
      <Globe />
      {children}
    </div>
  );
}
