import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import SEO from "../components/SEO";
import ScrollSection from "../components/ScrollSection";
import CountUp from "../components/CountUp";
import { api } from "../api/client";
import InvoicesPage from "./InvoicesPage";
import ClientsPage from "./ClientsPage";
import AIAgentPage from "./AIAgentPage";
import ReportsPage from "./ReportsPage";
import SettingsPage from "./SettingsPage";
import SmartExtensionPage from "./SmartExtensionPage";
import InvoiceTrackerPage from "./InvoiceTrackerPage";
import DeadlineMessagesPage from "./DeadlineMessagesPage";
import FraudDetectorPage from "./FraudDetectorPage";
import HelpPage from "./HelpPage";

const STATUS_COLOR = {
  Paid:     { bg: "#DCFCE7", color: "#15803D" },
  Pending:  { bg: "#FEF9C3", color: "#A16207" },
  Overdue:  { bg: "#FEE2E2", color: "#B91C1C" },
  Disputed: { bg: "#EDE9FE", color: "#6D28D9" },
};

const SECTION_VARIANT = {
  "Dashboard":    "fadeUp",
  "Invoices":     "slideLeft",
  "Clients":      "slideRight",
  "AI Agent":     "scaleIn",
  "Extensions":   "dropIn",
  "Tracker":      "zoomFade",
  "Messages":     "slideLeft",
  "Fraud Check":  "pulseIn",
  "Reports":      "flipUp",
  "Settings":     "fadeUp",
  "Help":         "scaleIn",
};

const SECTION_AMBIENT = {
  "Dashboard":    { speed: 30, direction: "vertical",   density: "normal" },
  "Invoices":     { speed: 50, direction: "horizontal", density: "normal" },
  "Clients":      { speed: 45, direction: "horizontal", density: "sparse" },
  "AI Agent":     { speed: 60, direction: "diagonal",   density: "dense" },
  "Extensions":   { speed: 35, direction: "vertical",   density: "sparse" },
  "Tracker":      { speed: 55, direction: "diagonal",   density: "normal" },
  "Messages":     { speed: 40, direction: "horizontal", density: "normal" },
  "Fraud Check":  { speed: 25, direction: "vertical",   density: "dense" },
  "Reports":      { speed: 50, direction: "diagonal",   density: "sparse" },
  "Settings":     { speed: 20, direction: "vertical",   density: "sparse" },
  "Help":         { speed: 30, direction: "horizontal", density: "normal" },
};

function fmtCurrency(n) {
  return "₹" + Math.round(n || 0).toLocaleString("en-IN");
}

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function initials(name) {
  if (!name) return "?";
  const parts = name.trim().split(" ");
  return parts.length > 1 ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() : name.slice(0, 2).toUpperCase();
}

const MONTH_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export default function HomePage({ user, onLogout }) {
  const [activeNav, setActiveNav] = useState("Dashboard");
  const [search, setSearch] = useState("");

  // Real dashboard data
  const [summary, setSummary] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [clients, setClients] = useState([]);
  const [monthly, setMonthly] = useState([]);
  const [dashLoading, setDashLoading] = useState(true);
  const [dashError, setDashError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function loadDashboard() {
      setDashLoading(true);
      setDashError("");
      try {
        const [s, inv, cl, m] = await Promise.all([
          api.getSummary(),
          api.getInvoices(),
          api.getClients(),
          api.getMonthlyReport(),
        ]);
        if (cancelled) return;
        setSummary(s);
        setInvoices(inv || []);
        setClients(cl || []);
        setMonthly(m || []);
      } catch (err) {
        if (!cancelled) setDashError(err.message || "Failed to load dashboard data");
      } finally {
        if (!cancelled) setDashLoading(false);
      }
    }
    loadDashboard();
    return () => { cancelled = true; };
  }, []);

  const clientById = (id) => clients.find((c) => c.id === id);

  // Recent invoices: latest 5 by issued date, mapped to display shape
  const recentInvoices = [...invoices]
    .sort((a, b) => new Date(b.issued_date) - new Date(a.issued_date))
    .slice(0, 5)
    .map((inv) => {
      const client = clientById(inv.client_id);
      const name = client ? client.name : `Client #${inv.client_id}`;
      return {
        id: inv.invoice_number,
        client: name,
        avatar: initials(name),
        amount: fmtCurrency(inv.amount),
        due: formatDate(inv.due_date),
        status: inv.status,
      };
    });

  const filtered = recentInvoices.filter((inv) =>
    inv.client.toLowerCase().includes(search.toLowerCase()) ||
    inv.id.toLowerCase().includes(search.toLowerCase()) ||
    inv.status.toLowerCase().includes(search.toLowerCase())
  );

  // Stat cards from /reports/summary
  const STATS = summary ? [
    { label: "Total Billed", value: fmtCurrency(summary.total_billed), icon: "📋", color: "#5B2A9E" },
    { label: "Collected", value: fmtCurrency(summary.total_collected), icon: "✅", color: "#16A34A" },
    { label: "Outstanding", value: fmtCurrency((summary.total_pending || 0) + (summary.total_overdue || 0)), icon: "⏳", color: "#D97706" },
    { label: "Total Clients", value: String(summary.total_clients || 0), icon: "👥", color: "#0EA5E9" },
  ] : [];

  // Monthly revenue bar chart from /reports/monthly
  const maxRevenue = monthly.length ? Math.max(...monthly.map((m) => m.revenue || 0)) : 0;
  const BAR_DATA = monthly.map((m) => {
    const [, monthNum] = (m.month || "").split("-");
    const idx = monthNum ? parseInt(monthNum, 10) - 1 : 0;
    return {
      month: MONTH_SHORT[idx] || m.month,
      value: maxRevenue > 0 ? Math.round(((m.revenue || 0) / maxRevenue) * 100) : 0,
      isLatest: false,
    };
  });
  if (BAR_DATA.length) BAR_DATA[BAR_DATA.length - 1].isLatest = true;

  // Risk alerts: high-risk clients (risk_score >= 60), same threshold as ClientsPage
  const RISK_ALERTS = clients
    .filter((c) => (c.risk_score || 0) >= 60)
    .map((c) => {
      const clientInvoices = invoices.filter((inv) => inv.client_id === c.id);
      const overdue = clientInvoices.filter((inv) => inv.status === "Overdue");
      const totalOverdue = overdue.reduce((s, inv) => s + (inv.amount || 0), 0);
      return {
        name: c.name,
        avatar: initials(c.name),
        amount: fmtCurrency(totalOverdue || clientInvoices.reduce((s, inv) => s + (inv.amount || 0), 0)),
        reason: overdue.length > 0
          ? `${overdue.length} overdue invoice${overdue.length > 1 ? "s" : ""}`
          : "High payment risk score",
        risk: Math.round(c.risk_score || 0),
      };
    })
    .sort((a, b) => b.risk - a.risk)
    .slice(0, 5);

  const navItems = [
    { icon: "📊", label: "Dashboard" },
    { icon: "📄", label: "Invoices" },
    { icon: "👥", label: "Clients" },
    { icon: "🤖", label: "AI Agent" },
    { icon: "🗓", label: "Extensions" },
    { icon: "🔍", label: "Tracker" },
    { icon: "⏰", label: "Messages" },
    { icon: "🛡️", label: "Fraud Check" },
    { icon: "📈", label: "Reports" },
    { icon: "⚙️", label: "Settings" },
    { icon: "❓", label: "Help" },
  ];

  const sectionRefs = useRef({});
  const mainRef = useRef(null);
  const isClickScrolling = useRef(false);
  const [bounceKey, setBounceKey] = useState({});

  const scrollToSection = (label) => {
    const el = sectionRefs.current[label];
    if (!el) return;
    isClickScrolling.current = true;
    setActiveNav(label);
    setBounceKey((prev) => ({ ...prev, [label]: (prev[label] || 0) + 1 }));
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    setTimeout(() => { isClickScrolling.current = false; }, 700);
  };

  useEffect(() => {
    if (mainRef.current) mainRef.current.scrollTop = 0;
  }, []);

  useEffect(() => {
    const root = mainRef.current;
    if (!root) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (isClickScrolling.current) return;
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) {
          const label = visible.target.getAttribute("data-scroll-section");
          if (label) setActiveNav(label);
        }
      },
      { root, threshold: [0.3, 0.5, 0.7] }
    );

    Object.values(sectionRefs.current).forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const todayLabel = new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  return (
    <div style={styles.page}>
      <SEO title={`${activeNav} — Dashboard`} description="Ledgerly dashboard." path="/dashboard" noIndex />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; }

        @keyframes fadeUp { from{opacity:0;transform:translateY(12px);} to{opacity:1;transform:translateY(0);} }
        @keyframes barAnim { from{height:0;} to{height:var(--h);} }
        @keyframes pulse { 0%,100%{opacity:1;} 50%{opacity:0.4;} }

        .stat-card { animation: fadeUp 0.5s ease both; }
        .stat-card:nth-child(1){animation-delay:0.05s}
        .stat-card:nth-child(2){animation-delay:0.10s}
        .stat-card:nth-child(3){animation-delay:0.15s}
        .stat-card:nth-child(4){animation-delay:0.20s}

        .nav-item {
          display:flex; align-items:center; gap:12px; padding:11px 16px;
          border-radius:10px; cursor:pointer; font-size:14px; font-weight:500;
          color:rgba(255,255,255,0.7); transition:background 0.15s, color 0.15s;
          margin-bottom:2px;
        }
        .nav-item:hover { background:rgba(255,255,255,0.1); color:#fff; }
        .nav-item.active { background:rgba(255,148,114,0.25); color:#FF9472; font-weight:600; }

        .action-btn {
          padding:9px 18px; border-radius:8px; border:none; cursor:pointer;
          font-family:'Inter',sans-serif; font-size:13.5px; font-weight:600;
          transition:transform 0.12s, box-shadow 0.12s, filter 0.12s;
        }
        .action-btn:hover { transform:translateY(-1px); filter:brightness(1.08); }
        .action-btn.primary { background:linear-gradient(120deg,#FF6B81,#FF9472); color:#fff; box-shadow:0 6px 16px rgba(255,107,129,0.3); }
        .action-btn.secondary { background:#fff; color:#2A1149; border:1.5px solid #E2E8F4; }

        .search-input {
          width:100%; padding:10px 16px 10px 40px; border-radius:9px;
          border:1.5px solid #E2E8F4; background:#F7F9FC;
          font-family:'Inter',sans-serif; font-size:14px; color:#2A3554; outline:none;
          transition:border-color 0.18s, box-shadow 0.18s;
        }
        .search-input:focus { border-color:#FF9472; box-shadow:0 0 0 4px rgba(255,148,114,0.12); background:#fff; }
        .search-input::placeholder { color:#9AA7C2; }

        .inv-row { transition:background 0.15s; }
        .inv-row:hover { background:#F7F0FF; }

        .ai-badge { animation:pulse 2s ease-in-out infinite; }

        ::-webkit-scrollbar { width:6px; }
        ::-webkit-scrollbar-track { background:#F4F7FC; }
        ::-webkit-scrollbar-thumb { background:#D0BDF4; border-radius:6px; }

        section[data-scroll-section] { scroll-margin-top: 16px; }
        section[data-scroll-section]:not(:first-child) {
          border-top: 1px dashed #E2D9F5;
          padding-top: 36px;
          margin-top: 12px;
        }
      `}</style>

      <div style={styles.shell}>
        {/* SIDEBAR */}
        <div style={styles.sidebar}>
          <div style={styles.sidebarTop}>
            <div style={styles.logoRow}>
              <div style={styles.logoIcon}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="2" width="18" height="20" rx="2" stroke="#FFB199" strokeWidth="1.7"/>
                  <line x1="7" y1="7" x2="17" y2="7" stroke="#FFB199" strokeWidth="1.7" strokeLinecap="round"/>
                  <line x1="7" y1="11" x2="17" y2="11" stroke="#fff" strokeWidth="1.7" strokeLinecap="round"/>
                  <line x1="7" y1="15" x2="13" y2="15" stroke="#fff" strokeWidth="1.7" strokeLinecap="round"/>
                </svg>
              </div>
              <span style={styles.logoText}>Ledgerly</span>
            </div>
          </div>

          <div style={styles.sidebarNav}>
            <p style={styles.navSection}>MAIN MENU</p>
            {navItems.map(item => (
              <div
                key={item.label}
                className={`nav-item${activeNav === item.label ? " active" : ""}`}
                onClick={() => scrollToSection(item.label)}
              >
                <motion.span
                  key={bounceKey[item.label] || 0}
                  style={{ fontSize: 16, display: "inline-block" }}
                  whileTap={{ scale: 0.75 }}
                  initial={false}
                  animate={bounceKey[item.label] ? { y: [0, -6, 0], scale: [1, 1.25, 1] } : {}}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  {item.icon}
                </motion.span>
                <span>{item.label}</span>
              </div>
            ))}
          </div>

          <div style={styles.sidebarBottom}>
            <div style={styles.userRow}>
              <div style={styles.userAvatar}>
                {user?.name?.split(" ").map(w => w[0]).join("").slice(0, 2)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={styles.userName}>{user?.name || "Admin"}</p>
                <p style={styles.userEmail}>{user?.email || ""}</p>
              </div>
              <button onClick={onLogout} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.5)", fontSize: 18, padding: 4 }} title="Logout">⏻</button>
            </div>
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div style={styles.main} ref={mainRef}>
          <ScrollSection
            id="section-dashboard"
            label="Dashboard"
            variant={SECTION_VARIANT["Dashboard"]}
            ambient={SECTION_AMBIENT["Dashboard"]}
            ref={(el) => (sectionRefs.current["Dashboard"] = el)}
          >
            {/* TOPBAR */}
            <div style={styles.topbar}>
              <div>
                <h1 style={styles.pageTitle}>Dashboard</h1>
                <p style={styles.pageSubtitle}>{todayLabel} · Welcome back, {user?.name?.split(" ")[0] || "Admin"} 👋</p>
              </div>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
               <button className="action-btn secondary" onClick={() => scrollToSection("Invoices")}>
                  + New Invoice
              </button>
              <button className="action-btn primary" onClick={() => scrollToSection("AI Agent")}>
                🤖 Ask AI Agent
              </button>
             </div>
            </div>

            {dashError && (
              <div style={{ background: "#FEE2E2", color: "#B91C1C", padding: "10px 16px", borderRadius: 8, marginBottom: 16, fontSize: 13 }}>{dashError}</div>
            )}

            {dashLoading ? (
              <div style={{ textAlign: "center", padding: "60px 0", color: "#9AA7C2" }}>
                <p style={{ fontSize: 14 }}>Loading dashboard...</p>
              </div>
            ) : (
            <>
            {/* STAT CARDS */}
            <div style={styles.statsGrid}>
              {STATS.map((s, i) => (
                <motion.div
                  key={i}
                  className="stat-card"
                  style={styles.statCard}
                  whileHover={{ y: -8, rotate: i % 2 === 0 ? -1.5 : 1.5, scale: 1.03 }}
                  transition={{ type: "spring", stiffness: 300, damping: 14 }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <p style={styles.statLabel}>{s.label}</p>
                      <p style={styles.statValue}><CountUp value={s.value} /></p>
                    </div>
                    <div style={{ ...styles.statIcon, background: `${s.color}18` }}>
                      <span style={{ fontSize: 22 }}>{s.icon}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <div style={styles.twoCol}>
              {/* INVOICE TABLE */}
              <div style={{ ...styles.card, flex: 1.6 }}>
                <div style={styles.cardHeader}>
                  <h2 style={styles.cardTitle}>Recent Invoices</h2>
                  <div style={{ position: "relative", width: 220 }}>
                    <span style={{ position: "absolute", left: 12, top: 11, fontSize: 14, color: "#9AA7C2" }}>🔍</span>
                    <input className="search-input" placeholder="Search invoices..." value={search} onChange={e => setSearch(e.target.value)} />
                  </div>
                </div>
                <table style={styles.table}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid #F0EAF8" }}>
                      {["Invoice", "Client", "Amount", "Due Date", "Status", "Action"].map(h => (
                        <th key={h} style={styles.th}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 && (
                      <tr><td colSpan={6} style={{ textAlign: "center", padding: "32px 0", color: "#9AA7C2" }}>No invoices yet</td></tr>
                    )}
                    {filtered.map((inv, i) => (
                      <tr key={i} className="inv-row" style={{ borderBottom: "1px solid #F4F0FC" }}>
                        <td style={styles.td}><span style={{ fontWeight: 600, color: "#5B2A9E", fontSize: 13 }}>{inv.id}</span></td>
                        <td style={styles.td}>
                          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                            <div style={{ ...styles.avatar, background: `hsl(${inv.client.charCodeAt(0) * 5 % 360},60%,72%)` }}>{inv.avatar}</div>
                            <span style={{ fontWeight: 500, fontSize: 13.5 }}>{inv.client}</span>
                          </div>
                        </td>
                        <td style={styles.td}><span style={{ fontWeight: 600, fontSize: 13.5 }}>{inv.amount}</span></td>
                        <td style={styles.td}><span style={{ fontSize: 13, color: "#6B7894" }}>{inv.due}</span></td>
                        <td style={styles.td}>
                          <motion.span
                            style={{ ...styles.statusBadge, background: STATUS_COLOR[inv.status]?.bg, color: STATUS_COLOR[inv.status]?.color, display: "inline-block" }}
                            initial={{ opacity: 0, scale: 0.4 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ type: "spring", stiffness: 400, damping: 12, delay: i * 0.04 }}
                          >
                            {inv.status}
                          </motion.span>
                        </td>
                        <td style={styles.td}>
                          <button onClick={() => scrollToSection("Invoices")} style={{ background: "none", border: "1.5px solid #E2E8F4", borderRadius: 7, padding: "5px 12px", fontSize: 12, fontWeight: 600, color: "#5B2A9E", cursor: "pointer" }}>
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* RIGHT COLUMN */}
              <div style={{ display: "flex", flexDirection: "column", gap: 20, flex: 1 }}>
                {/* REVENUE CHART */}
                <div style={styles.card}>
                  <h2 style={styles.cardTitle}>Monthly Revenue</h2>
                  {BAR_DATA.length === 0 ? (
                    <p style={{ fontSize: 13, color: "#9AA7C2", marginTop: 16 }}>No revenue data yet</p>
                  ) : (
                    <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height: 100, marginTop: 16 }}>
                      {BAR_DATA.map((b, i) => (
                        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                          <div style={{
                            width: "100%",
                            background: b.isLatest ? "linear-gradient(180deg,#FF6B81,#FF9472)" : "linear-gradient(180deg,#DDD6FE,#C4B5FD)",
                            borderRadius: "5px 5px 0 0",
                            height: `${Math.max(b.value, 3)}%`,
                            transition: "height 0.6s ease",
                          }} />
                          <span style={{ fontSize: 11, color: "#9AA7C2", fontWeight: 500 }}>{b.month}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* AI AGENT PANEL */}
                <div style={{ ...styles.card, background: "linear-gradient(135deg,#1A1140,#3B1F73)", color: "#fff" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                    <span style={{ fontSize: 22 }}>🤖</span>
                    <div>
                      <h2 style={{ ...styles.cardTitle, color: "#fff", margin: 0 }}>AI Resolution Agent</h2>
                      <span className="ai-badge" style={{ fontSize: 11, color: "#FF9472", fontWeight: 600 }}>● ACTIVE</span>
                    </div>
                  </div>
                  <p style={{ fontSize: 12.5, color: "rgba(255,255,255,0.65)", margin: "0 0 12px" }}>
                    Live activity stats coming soon — see the AI Agent tab for details.
                  </p>
                  <button
                    className="action-btn"
                    onClick={() => scrollToSection("AI Agent")}
                    style={{ width: "100%", background: "rgba(255,148,114,0.2)", color: "#FFB199", border: "1px solid rgba(255,148,114,0.3)", borderRadius: 9, padding: "10px 0", fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}
                  >
                    View Agent Logs →
                  </button>
                </div>
              </div>
            </div>

            {/* RISK EARLY WARNING ALERTS */}
            {RISK_ALERTS.length > 0 && (
              <div style={{ ...styles.card, marginTop: 20, border: "1.5px solid #FEE2E2" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 18 }}>🚨</span>
                    <h2 style={styles.cardTitle}>Risk Early Warnings</h2>
                  </div>
                  <button onClick={() => scrollToSection("Clients")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12.5, fontWeight: 600, color: "#5B2A9E" }}>
                    View all in Clients →
                  </button>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {RISK_ALERTS.map((r, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", background: "#FFF8F8", borderRadius: 10, border: "1px solid #FEE2E2" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ ...styles.avatar, background: `hsl(${r.name.charCodeAt(0) * 5 % 360},60%,72%)` }}>{r.avatar}</div>
                        <div>
                          <p style={{ margin: 0, fontWeight: 700, fontSize: 13.5, color: "#1A1140" }}>{r.name} <span style={{ color: "#9AA7C2", fontWeight: 500 }}>· {r.amount}</span></p>
                          <p style={{ margin: "2px 0 0", fontSize: 12, color: "#B91C1C" }}>{r.reason}</p>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0, marginLeft: 12 }}>
                        <span style={{ ...styles.statusBadge, background: "#FEE2E2", color: "#DC2626" }}>Risk {r.risk}</span>
                        <button onClick={() => scrollToSection("Extensions")} style={{ background: "none", border: "1.5px solid #5B2A9E", borderRadius: 7, padding: "5px 12px", fontSize: 12, fontWeight: 600, color: "#5B2A9E", cursor: "pointer" }}>
                          Extend →
                        </button>
                        <button onClick={() => scrollToSection("Tracker")} style={{ background: "none", border: "1.5px solid #0EA5E9", borderRadius: 7, padding: "5px 12px", fontSize: 12, fontWeight: 600, color: "#0EA5E9", cursor: "pointer" }}>
                          Track →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ACTIVITY FEED — no backend activity log yet */}
            <div style={{ ...styles.card, marginTop: 20 }}>
              <h2 style={styles.cardTitle}>Recent Activity</h2>
              <p style={{ textAlign: "center", padding: "24px 0", color: "#9AA7C2", fontSize: 13.5, margin: 0 }}>
                Activity log coming soon
              </p>
            </div>
            </>
            )}
          </ScrollSection>

          <ScrollSection id="section-invoices" label="Invoices" variant={SECTION_VARIANT["Invoices"]} ambient={SECTION_AMBIENT["Invoices"]} ref={(el) => (sectionRefs.current["Invoices"] = el)}>
            <InvoicesPage onNavigate={scrollToSection} />
          </ScrollSection>

          <ScrollSection id="section-clients" label="Clients" variant={SECTION_VARIANT["Clients"]} ambient={SECTION_AMBIENT["Clients"]} ref={(el) => (sectionRefs.current["Clients"] = el)}>
            <ClientsPage />
          </ScrollSection>

          <ScrollSection id="section-ai-agent" label="AI Agent" variant={SECTION_VARIANT["AI Agent"]} ambient={SECTION_AMBIENT["AI Agent"]} ref={(el) => (sectionRefs.current["AI Agent"] = el)}>
            <AIAgentPage />
          </ScrollSection>

          <ScrollSection id="section-extensions" label="Extensions" variant={SECTION_VARIANT["Extensions"]} ambient={SECTION_AMBIENT["Extensions"]} ref={(el) => (sectionRefs.current["Extensions"] = el)}>
            <SmartExtensionPage />
          </ScrollSection>

          <ScrollSection id="section-tracker" label="Tracker" variant={SECTION_VARIANT["Tracker"]} ambient={SECTION_AMBIENT["Tracker"]} ref={(el) => (sectionRefs.current["Tracker"] = el)}>
            <InvoiceTrackerPage />
          </ScrollSection>

          <ScrollSection id="section-messages" label="Messages" variant={SECTION_VARIANT["Messages"]} ambient={SECTION_AMBIENT["Messages"]} ref={(el) => (sectionRefs.current["Messages"] = el)}>
            <DeadlineMessagesPage />
          </ScrollSection>

          <ScrollSection id="section-fraud-check" label="Fraud Check" variant={SECTION_VARIANT["Fraud Check"]} ambient={SECTION_AMBIENT["Fraud Check"]} ref={(el) => (sectionRefs.current["Fraud Check"] = el)}>
            <FraudDetectorPage />
          </ScrollSection>

          <ScrollSection id="section-reports" label="Reports" variant={SECTION_VARIANT["Reports"]} ambient={SECTION_AMBIENT["Reports"]} ref={(el) => (sectionRefs.current["Reports"] = el)}>
            <ReportsPage />
          </ScrollSection>

          <ScrollSection id="section-settings" label="Settings" variant={SECTION_VARIANT["Settings"]} ambient={SECTION_AMBIENT["Settings"]} ref={(el) => (sectionRefs.current["Settings"] = el)}>
            <SettingsPage user={user} />
          </ScrollSection>

          <ScrollSection id="section-help" label="Help" variant={SECTION_VARIANT["Help"]} ambient={SECTION_AMBIENT["Help"]} ref={(el) => (sectionRefs.current["Help"] = el)} style={{ minHeight: "auto" }}>
            <HelpPage />
          </ScrollSection>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", background: "#F4F7FC", fontFamily: "'Inter',sans-serif" },
  shell: { display: "flex", minHeight: "100vh" },
  sidebar: { width: 240, background: "linear-gradient(180deg,#1A1140 0%,#3B1F73 100%)", display: "flex", flexDirection: "column", position: "fixed", top: 0, left: 0, height: "100vh", zIndex: 100 },
  sidebarTop: { padding: "24px 20px 16px" },
  logoRow: { display: "flex", alignItems: "center", gap: 10 },
  logoIcon: { width: 34, height: 34, borderRadius: 9, background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.28)", display: "flex", alignItems: "center", justifyContent: "center" },
  logoText: { fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 18, color: "#fff", letterSpacing: "-0.3px" },
  sidebarNav: { flex: 1, padding: "8px 12px", overflowY: "auto" },
  navSection: { fontSize: 10.5, fontWeight: 700, color: "rgba(255,255,255,0.35)", letterSpacing: "1.2px", padding: "0 4px", margin: "8px 0 6px" },
  sidebarBottom: { padding: "16px 12px", borderTop: "1px solid rgba(255,255,255,0.1)" },
  userRow: { display: "flex", alignItems: "center", gap: 10 },
  userAvatar: { width: 34, height: 34, borderRadius: "50%", background: "rgba(255,148,114,0.3)", border: "2px solid #FF9472", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#FF9472", flexShrink: 0 },
  userName: { margin: 0, fontSize: 13, fontWeight: 600, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  userEmail: { margin: 0, fontSize: 11, color: "rgba(255,255,255,0.45)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  main: { marginLeft: 240, flex: 1, padding: "28px 32px", height: "100vh", overflowY: "auto", scrollBehavior: "smooth", overflowAnchor: "none" },
  topbar: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 26 },
  pageTitle: { fontFamily: "'Space Grotesk',sans-serif", fontSize: 24, fontWeight: 700, color: "#1A1140", margin: 0, letterSpacing: "-0.4px" },
  pageSubtitle: { fontSize: 13.5, color: "#6B7894", margin: "4px 0 0" },
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 18, marginBottom: 22 },
  statCard: { background: "#fff", borderRadius: 14, padding: "20px 22px", boxShadow: "0 2px 12px rgba(91,42,158,0.08)", border: "1px solid #F0EAF8" },
  statLabel: { fontSize: 12.5, color: "#6B7894", fontWeight: 600, letterSpacing: "0.3px", margin: "0 0 6px", textTransform: "uppercase" },
  statValue: { fontFamily: "'Space Grotesk',sans-serif", fontSize: 28, fontWeight: 700, color: "#1A1140", margin: "0 0 4px", letterSpacing: "-0.5px" },
  statIcon: { width: 48, height: 48, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" },
  twoCol: { display: "flex", gap: 20 },
  card: { background: "#fff", borderRadius: 14, padding: "22px 24px", boxShadow: "0 2px 12px rgba(91,42,158,0.08)", border: "1px solid #F0EAF8" },
  cardHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  cardTitle: { fontFamily: "'Space Grotesk',sans-serif", fontSize: 16, fontWeight: 700, color: "#1A1140", margin: 0 },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { textAlign: "left", fontSize: 11.5, fontWeight: 700, color: "#9AA7C2", textTransform: "uppercase", letterSpacing: "0.5px", padding: "0 12px 12px 0" },
  td: { padding: "12px 12px 12px 0", fontSize: 13.5, color: "#2A3554", verticalAlign: "middle" },
  avatar: { width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#fff", flexShrink: 0 },
  statusBadge: { padding: "4px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" },
};