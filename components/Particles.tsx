"use client";

import { useMemo } from "react";

export function Particles({ count = 20 }: { count?: number }) {
  const dots = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        left: `${(i * 97) % 100}%`,
        delay: `${((i * 53) % 180) / 10}s`,
        duration: `${14 + ((i * 37) % 120) / 10}s`,
        opacity: 0.25 + ((i * 29) % 40) / 100,
      })),
    [count]
  );
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      {dots.map((d, i) => (
        <span
          key={i}
          className="particle"
          style={{ left: d.left, animationDelay: d.delay, animationDuration: d.duration, opacity: d.opacity }}
        />
      ))}
    </div>
  );
}
