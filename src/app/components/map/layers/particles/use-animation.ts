import { useEffect, useState } from "react";
import { PARTICLE_CONFIG } from "./config";

/**
 * A simple animation hook that:
 * 1. Creates a frame counter that loops from 0 to loopLength
 * 2. Updates at the specified fps using requestAnimationFrame
 * 3. Returns the current frame number for the TripsLayer
 *
 * Example: With fps=20 and loopLength=100:
 * - Updates 20 times per second
 * - Counts from 0 to 99 and loops
 * - Each frame represents 1% of the animation
 */
export const useAnimationFrame = (fps = PARTICLE_CONFIG.animation.fps) => {
  const [frame, setFrame] = useState(0);
  const frameTime = 1000 / fps; // Time between frames in ms

  useEffect(() => {
    let lastTime = 0;
    let animationId: number;

    const animate = (time: number) => {
      // Only update if enough time has passed for the next frame
      if (time - lastTime >= frameTime) {
        setFrame((prev) => (prev + 1) % PARTICLE_CONFIG.animation.loopLength);
        lastTime = time;
      }
      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, [fps, frameTime]);

  return frame;
};
