import React from "react";
import FAQAccordion from "../components/FAQAccordion";
import helpFaqData from "../data/helpFaqData";

export default function HelpPage() {
  return (
    <>
      {/* TOPBAR */}
      <div style={styles.topbar}>
        <div>
          <h1 style={styles.pageTitle}>Help & FAQ</h1>
          <p style={styles.pageSubtitle}>Answers to common questions about using Ledgerly day to day</p>
        </div>
      </div>

      <div style={styles.card}>
        <h2 style={styles.cardTitle}>Frequently asked questions</h2>
        <p style={{ fontSize: 13, color: "#9AA7C2", margin: "4px 0 18px" }}>
          Looking for pricing or security info instead? That's on the{" "}
          <a href="/" target="_blank" rel="noopener noreferrer" style={{ color: "#5B2A9E", fontWeight: 600 }}>
            public site
          </a>.
        </p>
        <FAQAccordion items={helpFaqData} defaultOpenIndex={0} />
      </div>
    </>
  );
}

const styles = {
  topbar: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 26 },
  pageTitle: { fontFamily: "'Space Grotesk',sans-serif", fontSize: 24, fontWeight: 700, color: "#1A1140", margin: 0, letterSpacing: "-0.4px" },
  pageSubtitle: { fontSize: 13.5, color: "#6B7894", margin: "4px 0 0" },
  card: { background: "#fff", borderRadius: 14, padding: "22px 24px", boxShadow: "0 2px 12px rgba(91,42,158,0.08)", border: "1px solid #F0EAF8" },
  cardTitle: { fontFamily: "'Space Grotesk',sans-serif", fontSize: 16, fontWeight: 700, color: "#1A1140", margin: 0 },
};
