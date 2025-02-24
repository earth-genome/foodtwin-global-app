const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div
      className={`w-[480px] bg-white h-screen grid grid-rows-[max-content_1fr] overflow-hidden`}
    >
      {children}
    </div>
  );
};

export default Layout;
