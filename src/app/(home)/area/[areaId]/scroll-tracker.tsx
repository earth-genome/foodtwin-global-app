"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

interface IScrollTracker {
  children: React.ReactNode;
}

function ScrollTracker({ children }: IScrollTracker) {
  const router = useRouter();
  const pathname = usePathname();

  const [ref, setRef] = useState<HTMLDivElement>();
  const onRef = (e: HTMLDivElement) => setRef(e);
  const currentSection = useRef<string | null>("");

  useEffect(() => {
    if (!ref) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const sorted = entries
          .filter(({ isIntersecting }) => isIntersecting)
          .sort((a, b) => a.intersectionRatio - b.intersectionRatio);

        const activeSection = sorted[0];
        if (activeSection) {
          const sectionId = activeSection.target.getAttribute("id");
          if (sectionId !== currentSection.current) {
            currentSection.current = sectionId;
            router.push(`${pathname}#${sectionId}`);
          }
        }
      },
      {
        threshold: 0.5,
      }
    );

    const children = ref.children || [];
    for (let i = 0, len = children.length; i < len; i++) {
      observer.observe(children[i]);
    }

    return () => {
      observer.disconnect();
    };
  }, [pathname, ref, router]);

  return (
    <div className="overflow-y-auto" ref={onRef}>
      {children}
    </div>
  );
}

export default ScrollTracker;
