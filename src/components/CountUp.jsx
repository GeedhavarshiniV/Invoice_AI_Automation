import { useEffect, useState } from "react";
import { motion, useSpring, useTransform } from "framer-motion";

/**
 * Animates a numeric value counting up from 0, with a slight springy
 * overshoot before settling — used for dashboard stat cards.
 *
 * Works with plain numbers ("84") and formatted currency strings
 * ("₹2,48,500") by extracting the prefix/numeric/suffix parts, animating
 * just the number, then re-applying Indian-style comma grouping so the
 * final rendered value matches the original exactly.
 *
 * Usage: <CountUp value="₹2,48,500" />  or  <CountUp value="84" />
 */
function formatIndianNumber(n) {
  const rounded = Math.round(n);
  const str = String(rounded);
  if (str.length <= 3) return str;
  const last3 = str.slice(-3);
  const rest = str.slice(0, -3);
  const restGrouped = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",");
  return `${restGrouped},${last3}`;
}

export default function CountUp({ value, duration = 1.1 }) {
  const match = String(value).match(/^(\D*)([\d,]+)(\D*)$/);
  const prefix = match ? match[1] : "";
  const numericTarget = match ? parseInt(match[2].replace(/,/g, ""), 10) : 0;
  const suffix = match ? match[3] : "";
  const hasGrouping = match ? match[2].includes(",") : false;

  const [display, setDisplay] = useState(0);
  const spring = useSpring(0, { stiffness: 90, damping: 12, mass: 0.6 });
  const rounded = useTransform(spring, (v) => Math.round(v));

  useEffect(() => {
    spring.set(numericTarget);
    const unsubscribe = rounded.on("change", (v) => setDisplay(v));
    return () => unsubscribe();
  }, [numericTarget, spring, rounded]);

  if (!match) return <>{value}</>;

  const formatted = hasGrouping ? formatIndianNumber(display) : String(display);

  return (
    <motion.span>
      {prefix}
      {formatted}
      {suffix}
    </motion.span>
  );
}