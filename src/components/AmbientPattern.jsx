import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

/**
 * A subtle, low-opacity dot/line pattern that sits behind a section's
 * content and drifts as the user scrolls past it. Purely decorative —
 * pointer-events disabled, sits at z-index 0 behind real content.
 *
 * Colors are drawn from the same palette used across the app:
 *   deep purple #5B2A9E / #1A1140, coral #FF6B81 / #FF9472
 *
 * `speed` + `direction` let each dashboard section drift differently:
 *   speed: how far the pattern travels across the scroll of its own section
 *          (in px — small numbers like 20-60 keep it subtle)
 *   direction: "vertical" | "diagonal" | "horizontal"
 */
export default function AmbientPattern({ speed = 40, direction = "vertical", density = "normal" }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const yRange = direction === "horizontal" ? [0, 0] : [-speed, speed];
  const xRange = direction === "vertical" ? [0, 0] : [-speed, speed];

  const y = useTransform(scrollYProgress, [0, 1], yRange);
  const x = useTransform(scrollYProgress, [0, 1], xRange);

  const gap = density === "sparse" ? 56 : density === "dense" ? 28 : 40;

  return (
    <div
      ref={ref}
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        zIndex: 0,
        pointerEvents: "none",
      }}
    >
      <motion.svg
        style={{
          position: "absolute",
          top: "-10%",
          left: "-10%",
          width: "120%",
          height: "120%",
          x,
          y,
        }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id={`ambient-dots-${gap}-${direction}`}
            width={gap}
            height={gap}
            patternUnits="userSpaceOnUse"
          >
            {/* dot */}
            <circle cx={gap / 2} cy={gap / 2} r="1.6" fill="#5B2A9E" opacity="0.10" />
            {/* connecting line hints, alternating accent color for subtle warmth */}
            <line x1="0" y1={gap / 2} x2={gap} y2={gap / 2} stroke="#5B2A9E" strokeWidth="0.5" opacity="0.05" />
            <line x1={gap / 2} y1="0" x2={gap / 2} y2={gap} stroke="#FF9472" strokeWidth="0.5" opacity="0.05" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#ambient-dots-${gap}-${direction})`} />
      </motion.svg>
    </div>
  );
}