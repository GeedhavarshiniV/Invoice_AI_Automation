import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Shared accordion UI for rendering a list of { question, answer } items.
 * Used by:
 *  - LandingPage (public marketing FAQ — also feeds the FAQPage JSON-LD schema)
 *  - HelpPage (dashboard-only product-usage FAQ — no schema needed, it's behind login)
 *
 * Keeping one accordion component means both FAQs always look and behave
 * identically, and any visual tweak only needs to happen in one place.
 */
export default function FAQAccordion({ items, defaultOpenIndex = 0 }) {
  const [openIndex, setOpenIndex] = useState(defaultOpenIndex);

  return (
    <div>
      <style>{`
        .faq-item { border-bottom:1px solid #ECE6F8; }
        .faq-q {
          width:100%; text-align:left; background:none; border:none; cursor:pointer;
          padding:20px 4px; display:flex; justify-content:space-between; align-items:center;
          font-family:'Space Grotesk',sans-serif; font-size:16px; font-weight:600; color:#1A1140;
          gap:16px;
        }
        .faq-chevron { flex-shrink:0; color:#5B2A9E; font-size:18px; display:inline-block; }
        .faq-a { font-size:14.5px; line-height:1.65; color:#4A5578; padding:0 4px 20px; margin:0; }
      `}</style>
      {items.map((item, i) => {
        const isOpen = openIndex === i;
        return (
          <div className="faq-item" key={i}>
            <button
              className="faq-q"
              onClick={() => setOpenIndex(isOpen ? -1 : i)}
              aria-expanded={isOpen}
            >
              <span>{item.question}</span>
              <motion.span
                className="faq-chevron"
                animate={{ rotate: isOpen ? 180 : 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 12 }}
              >
                ⌄
              </motion.span>
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0, scale: 0.97 }}
                  animate={{ opacity: 1, height: "auto", scale: 1 }}
                  exit={{ opacity: 0, height: 0, scale: 0.97 }}
                  transition={{ type: "spring", stiffness: 260, damping: 22 }}
                  style={{ overflow: "hidden" }}
                >
                  <p className="faq-a">{item.answer}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}