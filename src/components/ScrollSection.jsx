import { forwardRef } from "react";
import { motion } from "framer-motion";
import AmbientPattern from "./AmbientPattern";

/**
 * Wraps one full dashboard "page" section so it animates in as the user
 * scrolls to it. Unlike the generic <Reveal>, this supports distinct
 * named variants so each dashboard section can feel different —
 * Dashboard fades up, Invoices slides from the left, AI Agent scales in,
 * Fraud Check gets an alert-style pulse, etc.
 *
 * Usage:
 *   <ScrollSection id="invoices" variant="slideLeft">
 *     <InvoicesPage />
 *   </ScrollSection>
 */
const VARIANTS = {
  fadeUp: {
    initial: { opacity: 0, y: 50 },
    whileInView: { opacity: 1, y: 0 },
    transition: { type: "spring", stiffness: 180, damping: 14, mass: 0.9 },
  },
  slideLeft: {
    initial: { opacity: 0, x: -90 },
    whileInView: { opacity: 1, x: 0 },
    transition: { type: "spring", stiffness: 160, damping: 13 },
  },
  slideRight: {
    initial: { opacity: 0, x: 90 },
    whileInView: { opacity: 1, x: 0 },
    transition: { type: "spring", stiffness: 160, damping: 13 },
  },
  scaleIn: {
    initial: { opacity: 0, scale: 0.7 },
    whileInView: { opacity: 1, scale: 1 },
    transition: { type: "spring", stiffness: 220, damping: 14 },
  },
  zoomFade: {
    initial: { opacity: 0, scale: 1.15 },
    whileInView: { opacity: 1, scale: 1 },
    transition: { type: "spring", stiffness: 170, damping: 16 },
  },
  dropIn: {
    initial: { opacity: 0, y: -70 },
    whileInView: { opacity: 1, y: 0 },
    transition: { type: "spring", stiffness: 200, damping: 11 }, // bouncier overshoot
  },
  flipUp: {
    initial: { opacity: 0, rotateX: -25, y: 40 },
    whileInView: { opacity: 1, rotateX: 0, y: 0 },
    transition: { type: "spring", stiffness: 150, damping: 13 },
  },
  pulseIn: {
    // Used for alert-flavored sections (e.g. Fraud Check) — pops in then
    // gives a couple of springy pulses, more noticeable than before.
    initial: { opacity: 0, scale: 0.8 },
    whileInView: { opacity: 1, scale: [0.8, 1.08, 0.97, 1.03, 1] },
    transition: { duration: 0.9, ease: "easeOut", times: [0, 0.4, 0.6, 0.8, 1] },
  },
};

const ScrollSection = forwardRef(function ScrollSection(
  { id, label, variant = "fadeUp", ambient, children, style },
  ref
) {
  const v = VARIANTS[variant] || VARIANTS.fadeUp;

  return (
    <motion.section
      ref={ref}
      id={id}
      data-scroll-section={label || id}
      initial={v.initial}
      whileInView={v.whileInView}
      viewport={{ once: false, amount: 0.2 }}
      transition={v.transition}
      style={{ minHeight: "60vh", paddingBottom: 48, position: "relative", ...style }}
    >
      {ambient && (
        <AmbientPattern
          speed={ambient.speed ?? 40}
          direction={ambient.direction ?? "vertical"}
          density={ambient.density ?? "normal"}
        />
      )}
      <div style={{ position: "relative", zIndex: 1 }}>{children}</div>
    </motion.section>
  );
});

export default ScrollSection;