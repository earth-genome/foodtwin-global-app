import { useLayoutEffect, useRef } from "react";

type AnimationFrameCallback = (args: { time: number; delta: number }) => void;

export default function useAnimationFrame(cb: AnimationFrameCallback): void {
  const cbRef = useRef<AnimationFrameCallback>();
  const frame = useRef<number>();
  const init = useRef<number>(performance.now());
  const last = useRef<number>(performance.now());

  cbRef.current = cb;

  const animate = (now: number) => {
    if (cbRef.current) {
      cbRef.current({
        time: (now - init.current) / 1000,
        delta: (now - last.current) / 1000,
      });
    }
    last.current = now;
    frame.current = requestAnimationFrame(animate);
  };

  useLayoutEffect(() => {
    frame.current = requestAnimationFrame(animate);
    return () => {
      if (frame.current !== undefined) {
        cancelAnimationFrame(frame.current);
      }
    };
  }, []);
}
