"use client";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
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

  // Ensure that the last section of the sidebar is always the same height as
  // the sidebar to allow for scrolling.
  useLayoutEffect(() => {
    if (!ref) return;
    // Set the height of the last section to be the same as the sidebar.
    const lastSection = ref.children[ref.children.length - 1] as HTMLDivElement;
    const lastSectionOriginalHeight = lastSection.clientHeight;

    const sidebarHeight = ref.clientHeight;
    if (sidebarHeight > lastSectionOriginalHeight) {
      lastSection.style.height = `${sidebarHeight}px`;
    }

    // Observe the sidebar for changes in size.
    const resizeObserver = new ResizeObserver((e) => {
      const sidebarHeight = e[0].contentRect.height;
      if (sidebarHeight > lastSectionOriginalHeight) {
        lastSection.style.height = `${sidebarHeight}px`;
      }
    });
    resizeObserver.observe(ref);

    return () => {
      resizeObserver.disconnect();
    };
  }, [ref]);

  useEffect(() => {
    if (!ref) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const sorted = entries.filter(
          ({ isIntersecting, intersectionRatio }) =>
            isIntersecting && intersectionRatio > 0
        );

        const hitHeading = sorted[0]?.target as HTMLElement | undefined;
        if (hitHeading) {
          const activeSection = findParentBeforeRoot(hitHeading, ref);

          if (activeSection) {
            const sectionId = activeSection.getAttribute("id");
            if (sectionId !== currentSection.current) {
              currentSection.current = sectionId;
              router.push(`${pathname}?view=${sectionId}`);
            }
          }
        }
      },
      {
        rootMargin: "0px 0px -90% 0px",
        root: ref,
      }
    );

    const children = ref.querySelectorAll("[data-section-heading]");
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

const findParentBeforeRoot = (
  el: HTMLElement | null,
  root: HTMLElement
): HTMLElement | null => {
  if (!el) return null;
  if (el === root) return null;
  if (el.parentElement === root) return el;
  return findParentBeforeRoot(el.parentElement, root);
};
