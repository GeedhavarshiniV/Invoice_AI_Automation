import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import SEO, { SITE_URL } from "../components/SEO";
import FAQAccordion from "../components/FAQAccordion";
import Reveal from "../components/Reveal";
import faqData from "../data/faqData";

const FEATURES = [
  {
    icon: "🤖",
    title: "AI Resolution Agent",
    desc: "Automatically follows up on late invoices, approves short extensions within policy, and resolves common disputes — escalating to you only when it truly needs a human.",
  },
  {
    icon: "🛡️",
    title: "Fraud Detector",
    desc: "Flags suspicious invoices and risky client patterns before they become a financial loss, using behavioral and payment-history signals.",
  },
  {
    icon: "🔍",
    title: "Invoice Tracker",
    desc: "See every invoice's real-time status — paid, pending, overdue, disputed — in one dashboard, with early-warning risk alerts on slow-paying clients.",
  },
  {
    icon: "⏰",
    title: "Deadline Messages",
    desc: "Scheduled, automatic reminders before and after due dates, so fewer invoices ever slip into overdue territory.",
  },
  {
    icon: "🗓",
    title: "Smart Extensions",
    desc: "Clients can request payment extensions; the AI Agent evaluates and approves straightforward cases instantly.",
  },
  {
    icon: "📈",
    title: "Reports & Insights",
    desc: "Revenue trends, payment behavior, and collection performance, visualized and exportable whenever you need them.",
  },
];

export default function LandingPage() {

  // JSON-LD: FAQPage schema (AEO/GEO) — lets AI answer engines and rich
  // results extract these exact Q&A pairs.
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqData.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  // JSON-LD: SoftwareApplication schema — describes the product itself
  // for AEO/GEO and rich snippets (ratings, category, pricing model).
  const softwareSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Ledgerly",
    applicationCategory: "FinanceApplication",
    operatingSystem: "Web",
    description:
      "AI-powered invoice automation platform that creates, sends, tracks, and reconciles invoices, with an AI agent that follows up on payments, resolves disputes, and detects fraud risk.",
    url: SITE_URL,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      description: "Free to start",
    },
  };

  // JSON-LD: Organization schema — basic entity info for knowledge panels.
  const orgSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Ledgerly",
    url: SITE_URL,
    logo: `${SITE_URL}/logo512.png`,
  };

  return (
    <div style={styles.page}>
      <SEO
        title="AI Invoice Automation for Freelancers & Small Businesses"
        description="Ledgerly automates invoicing end-to-end: an AI agent chases late payments, resolves disputes, detects fraud risk, and tracks every invoice in real time — so you get paid faster with less manual work."
        path="/"
        schema={[softwareSchema, orgSchema, faqSchema]}
      />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; }

        .lp-nav a, .lp-nav button { font-family:'Inter',sans-serif; }
        .lp-cta {
          padding:11px 22px; border-radius:9px; border:none; cursor:pointer;
          font-family:'Space Grotesk',sans-serif; font-size:14.5px; font-weight:700;
          background:linear-gradient(120deg,#FF6B81,#FF9472); color:#fff;
          box-shadow:0 8px 20px rgba(255,107,129,0.32);
          transition:transform 0.15s, filter 0.15s; text-decoration:none; display:inline-block;
        }
        .lp-cta:hover { transform:translateY(-2px); filter:brightness(1.06); }
        .lp-cta-ghost {
          padding:10px 20px; border-radius:9px; border:1.5px solid rgba(255,255,255,0.25);
          cursor:pointer; font-family:'Inter',sans-serif; font-size:14px; font-weight:600;
          background:rgba(255,255,255,0.06); color:#fff; text-decoration:none; display:inline-block;
          transition:background 0.15s;
        }
        .lp-cta-ghost:hover { background:rgba(255,255,255,0.14); }

        .feature-card { transition:transform 0.18s, box-shadow 0.18s; }
        .feature-card:hover { transform:translateY(-4px); box-shadow:0 14px 28px rgba(91,42,158,0.14); }

        @media (max-width:840px) {
          .lp-hero-grid { grid-template-columns:1fr !important; }
          .lp-feature-grid { grid-template-columns:1fr 1fr !important; }
        }
        @media (max-width:560px) {
          .lp-feature-grid { grid-template-columns:1fr !important; }
          .lp-nav-links { display:none !important; }
        }
      `}</style>

      {/* NAVBAR */}
      <header style={styles.nav} className="lp-nav">
        <div style={styles.navInner}>
          <div style={styles.logoRow}>
            <div style={styles.logoIcon}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="2" width="18" height="20" rx="2" stroke="#FFB199" strokeWidth="1.7" />
                <line x1="7" y1="7" x2="17" y2="7" stroke="#FFB199" strokeWidth="1.7" strokeLinecap="round" />
                <line x1="7" y1="11" x2="17" y2="11" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" />
                <line x1="7" y1="15" x2="13" y2="15" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" />
              </svg>
            </div>
            <span style={styles.logoText}>Ledgerly</span>
          </div>
          <nav className="lp-nav-links" style={styles.navLinks}>
            <a href="#features" style={styles.navLink}>Features</a>
            <a href="#faq" style={styles.navLink}>FAQ</a>
          </nav>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <Link to="/login" className="lp-cta-ghost">Sign in</Link>
            <Link to="/login" className="lp-cta">Get started →</Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section style={styles.hero}>
        <div className="lp-hero-grid" style={styles.heroGrid}>
          <Reveal y={28} duration={0.65}>
            <span style={styles.eyebrow}>AI-Powered Invoice Automation</span>
            <h1 style={styles.heroHeading}>
              Invoices you can trust, <span style={{ color: "#FF9472" }}>resolved without the back-and-forth</span>
            </h1>
            <p style={styles.heroSub}>
              Ledgerly's AI agent sends invoices, chases late payments, negotiates extensions, and flags
              fraud risk automatically — so you spend less time on accounts receivable and get paid faster.
            </p>
            <div style={{ display: "flex", gap: 14, marginTop: 28, flexWrap: "wrap" }}>
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} style={{ display: "inline-block" }}>
                <Link to="/login" className="lp-cta" style={{ fontSize: 15.5, padding: "13px 26px" }}>
                  Start automating invoices →
                </Link>
              </motion.div>
              <a href="#faq" className="lp-cta-ghost" style={{ fontSize: 14.5, padding: "12px 24px" }}>
                See how it works
              </a>
            </div>
            <p style={styles.trustText}>🔒 Bank-grade encryption on every transaction</p>
          </Reveal>

          <Reveal y={28} delay={0.15} duration={0.65}>
            <motion.div
              style={styles.heroPanel}
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
            >
              <div style={styles.heroPanelHeader}>
                <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.8)" }}>AI Agent — live</span>
                <span className="ai-badge" style={{ background: "#FF6B81", color: "#fff", fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 10 }}>ACTIVE</span>
              </div>
              {[
                { label: "Reminders sent today", value: "12" },
                { label: "Extensions auto-approved", value: "4" },
                { label: "Disputes resolved", value: "2" },
                { label: "Fraud risk flags", value: "1" },
              ].map((item, i) => (
                <div key={i} style={styles.heroPanelRow}>
                  <span style={{ fontSize: 13.5, color: "rgba(255,255,255,0.75)" }}>{item.label}</span>
                  <span style={{ fontSize: 13.5, fontWeight: 700, color: "#FF9472" }}>{item.value}</span>
                </div>
              ))}
            </motion.div>
          </Reveal>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" style={styles.section}>
        <Reveal>
          <h2 style={styles.sectionTitle}>Everything accounts receivable needs, automated</h2>
          <p style={styles.sectionSub}>One AI agent, working across every stage of the invoice lifecycle.</p>
        </Reveal>
        <div className="lp-feature-grid" style={styles.featureGrid}>
          {FEATURES.map((f, i) => (
            <Reveal key={i} delay={(i % 3) * 0.1} y={18}>
              <div className="feature-card" style={styles.featureCard}>
                <motion.div
                  style={styles.featureIcon}
                  whileHover={{ rotate: [0, -12, 10, -8, 6, 0] }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                >
                  {f.icon}
                </motion.div>
                <h3 style={styles.featureTitle}>{f.title}</h3>
                <p style={styles.featureDesc}>{f.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* FAQ — visible content for users; same data also powers the
          FAQPage JSON-LD schema above for AEO/GEO. */}
      <section id="faq" style={styles.faqSection}>
        <div style={styles.faqInner}>
          <Reveal>
            <h2 style={styles.sectionTitle}>Frequently asked questions</h2>
            <p style={styles.sectionSub}>Everything you need to know about AI invoice automation with Ledgerly.</p>
          </Reveal>

          <Reveal delay={0.1}>
            <div style={{ marginTop: 32 }}>
              <FAQAccordion items={faqData} defaultOpenIndex={0} />
            </div>
          </Reveal>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={styles.footer}>
        <div style={styles.logoRow}>
          <div style={styles.logoIcon}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="2" width="18" height="20" rx="2" stroke="#FFB199" strokeWidth="1.7" />
              <line x1="7" y1="7" x2="17" y2="7" stroke="#FFB199" strokeWidth="1.7" strokeLinecap="round" />
              <line x1="7" y1="11" x2="17" y2="11" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" />
              <line x1="7" y1="15" x2="13" y2="15" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" />
            </svg>
          </div>
          <span style={{ ...styles.logoText, fontSize: 15 }}>Ledgerly</span>
        </div>
        <p style={styles.footerText}>© {new Date().getFullYear()} Ledgerly. AI-powered invoice automation.</p>
      </footer>
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", background: "#F4F7FC", fontFamily: "'Inter',sans-serif" },
  nav: { background: "#1A1140", position: "sticky", top: 0, zIndex: 50 },
  navInner: { maxWidth: 1180, margin: "0 auto", padding: "16px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" },
  logoRow: { display: "flex", alignItems: "center", gap: 10 },
  logoIcon: { width: 34, height: 34, borderRadius: 9, background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.28)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  logoText: { fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 18, color: "#fff", letterSpacing: "-0.3px" },
  navLinks: { display: "flex", gap: 28 },
  navLink: { color: "rgba(255,255,255,0.75)", textDecoration: "none", fontSize: 14, fontWeight: 500 },

  hero: { background: "linear-gradient(160deg,#1A1140 0%,#3B1F73 55%,#5B2A9E 100%)", padding: "64px 32px 80px" },
  heroGrid: { maxWidth: 1180, margin: "0 auto", display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 56, alignItems: "center" },
  eyebrow: { display: "inline-block", background: "rgba(255,148,114,0.18)", color: "#FFB199", fontSize: 12.5, fontWeight: 700, letterSpacing: "0.4px", padding: "6px 14px", borderRadius: 20, marginBottom: 20 },
  heroHeading: { fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 42, lineHeight: 1.2, color: "#fff", margin: "0 0 18px", letterSpacing: "-0.6px" },
  heroSub: { fontSize: 16, lineHeight: 1.65, color: "rgba(255,255,255,0.75)", margin: 0, maxWidth: 480 },
  trustText: { fontSize: 12.5, color: "rgba(255,255,255,0.55)", marginTop: 28 },

  heroPanel: { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.14)", borderRadius: 16, padding: "22px 24px", backdropFilter: "blur(6px)" },
  heroPanelHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, paddingBottom: 14, borderBottom: "1px solid rgba(255,255,255,0.12)" },
  heroPanelRow: { display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.08)" },

  section: { maxWidth: 1180, margin: "0 auto", padding: "80px 32px 40px" },
  sectionTitle: { fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 30, color: "#1A1140", margin: 0, letterSpacing: "-0.4px", textAlign: "center" },
  sectionSub: { fontSize: 15, color: "#6B7894", textAlign: "center", margin: "10px 0 0" },

  featureGrid: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20, marginTop: 44 },
  featureCard: { background: "#fff", borderRadius: 14, padding: "26px 24px", boxShadow: "0 2px 12px rgba(91,42,158,0.08)", border: "1px solid #F0EAF8" },
  featureIcon: { width: 48, height: 48, borderRadius: 12, background: "#F4F0FC", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, marginBottom: 14 },
  featureTitle: { fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 16.5, color: "#1A1140", margin: "0 0 8px" },
  featureDesc: { fontSize: 13.8, lineHeight: 1.6, color: "#6B7894", margin: 0 },

  faqSection: { background: "#fff", padding: "20px 32px 90px", borderTop: "1px solid #ECE6F8" },
  faqInner: { maxWidth: 740, margin: "0 auto", paddingTop: 60 },

  footer: { background: "#1A1140", padding: "32px", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 },
  footerText: { fontSize: 12.5, color: "rgba(255,255,255,0.4)", margin: 0 },
};