import { motion } from "framer-motion";

/**
 * Wraps any content in a fade + slide-up animation that triggers once
 * when it scrolls into view. Use for hero text, feature cards, FAQ items,
 * dashboard cards — anything that should feel like it "arrives" as the
 * user scrolls to it.
 *
 * Usage:
 *   <Reveal><h1>Hello</h1></Reveal>
 *   <Reveal delay={0.1}><FeatureCard /></Reveal>
 *   <Reveal as="span" y={0} delay={0.05}>inline content</Reveal>
 */
export default function Reveal({
  children,
  delay = 0,
  y = 22,
  duration = 0.55,
  once = true,
  amount = 0.2,
  style,
  ...rest
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, amount }}
      transition={{ duration, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
      style={style}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
