export default function Layout({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`w-[480px] bg-white h-screen grid grid-rows-[max-content_1fr] ${className}`}
    >
      {children}
    </div>
  );
}
