import { motion } from "framer-motion";

/**
 * Wraps a full page/route so it fades + slides in on mount and back out
 * on unmount. Used at the route level (Landing / Login / Dashboard) via
 * AnimatePresence in App.js, and reused inside the dashboard for nav-tab
 * switches (Invoices, AI Agent, Reports, etc.).
 */
export default function PageTransition({ children, keyName }) {
  return (
    <motion.div
      key={keyName}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.32, ease: [0.21, 0.47, 0.32, 0.98] }}
    >
      {children}
    </motion.div>
  );
}
