import React, { useState } from "react";

const CLIENTS = [
  {
    name: "Arjun Sharma", email: "arjun.sharma@mail.com", avatar: "AS", totalBilled: 84500, invoices: 6, risk: 18, lastPaid: "Jun 18, 2026",
    factors: [
      { label: "On-time payment rate", detail: "5 of last 6 invoices paid on time", impact: "low" },
      { label: "Invoice engagement", detail: "Opens invoices within a day of sending", impact: "low" },
    ],
    action: null,
  },
  {
    name: "Priya Nair", email: "priya.nair@mail.com", avatar: "PN", totalBilled: 156000, invoices: 9, risk: 72, lastPaid: "May 02, 2026",
    factors: [
      { label: "Late payment trend", detail: "3 of last 4 invoices paid 10+ days late", impact: "high" },
      { label: "Invoice not opened", detail: "Current invoice unopened 6 days after sending", impact: "high" },
      { label: "Communication gap", detail: "No reply to last reminder", impact: "medium" },
    ],
    action: "Send early check-in before due date — offer split payment proactively",
  },
  {
    name: "Karthik Rajan", email: "karthik.r@mail.com", avatar: "KR", totalBilled: 41200, invoices: 4, risk: 8, lastPaid: "Jun 18, 2026",
    factors: [
      { label: "On-time payment rate", detail: "4 of 4 invoices paid on time", impact: "low" },
    ],
    action: null,
  },
  {
    name: "Meena Iyer", email: "meena.iyer@mail.com", avatar: "MI", totalBilled: 98700, invoices: 7, risk: 22, lastPaid: "Jun 15, 2026",
    factors: [
      { label: "On-time payment rate", detail: "6 of 7 invoices paid on time", impact: "low" },
      { label: "Invoice engagement", detail: "Normal opening pattern", impact: "low" },
    ],
    action: null,
  },
  {
    name: "Vikram Menon", email: "vikram.m@mail.com", avatar: "VM", totalBilled: 67300, invoices: 5, risk: 58, lastPaid: "Apr 28, 2026",
    factors: [
      { label: "Late payment trend", detail: "2 of last 3 invoices paid late", impact: "medium" },
      { label: "Active dispute history", detail: "1 dispute raised in last 60 days", impact: "medium" },
    ],
    action: "Monitor closely — flag for review if next invoice goes unopened past day 5",
  },
  {
    name: "Sneha Pillai", email: "sneha.p@mail.com", avatar: "SP", totalBilled: 112000, invoices: 8, risk: 14, lastPaid: "Jun 10, 2026",
    factors: [
      { label: "On-time payment rate", detail: "8 of 8 invoices paid on time", impact: "low" },
    ],
    action: null,
  },
  {
    name: "Rahul Verma", email: "rahul.verma@mail.com", avatar: "RV", totalBilled: 23400, invoices: 3, risk: 35, lastPaid: "Jun 02, 2026",
    factors: [
      { label: "Limited history", detail: "Only 3 invoices on record, 1 paid 4 days late", impact: "medium" },
    ],
    action: null,
  },
  {
    name: "Divya Krishnan", email: "divya.k@mail.com", avatar: "DK", totalBilled: 201500, invoices: 11, risk: 81, lastPaid: "Mar 14, 2026",
    factors: [
      { label: "Late payment trend", detail: "4 of last 5 invoices paid 15+ days late", impact: "high" },
      { label: "Invoice not opened", detail: "Current invoice unopened 9 days after sending", impact: "high" },
      { label: "High outstanding amount", detail: "₹67,000 currently overdue", impact: "high" },
    ],
    action: "Escalate to admin now — large amount, repeated late pattern, no engagement",
  },
];

function riskBand(score) {
  if (score < 30) return { label: "Low risk", color: "#16A34A", bg: "#DCFCE7" };
  if (score < 60) return { label: "Medium risk", color: "#D97706", bg: "#FEF3C7" };
  return { label: "High risk", color: "#DC2626", bg: "#FEE2E2" };
}

const IMPACT_COLOR = {
  low: "#16A34A",
  medium: "#D97706",
  high: "#DC2626",
};

function fmt(n) {
  return "₹" + n.toLocaleString("en-IN");
}

function WorkflowStrip() {
  const steps = [
    { icon: "📄", label: "Invoice Sent" },
    { icon: "🧠", label: "AI Analyzes History" },
    { icon: "📊", label: "Risk Score Generated" },
    { icon: "🚨", label: "High-Risk Detected" },
    { icon: "🔔", label: "Admin Alert + Action" },
  ];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4, overflowX: "auto", padding: "4px 0" }}>
      {steps.map((s, i) => (
        <React.Fragment key={i}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 92, flexShrink: 0 }}>
            <div
              style={{
                width: 42, height: 42, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 18, background: i === 3 ? "#FEE2E2" : i === 4 ? "linear-gradient(120deg,#FF6B81,#FF9472)" : "#F4F0FC",
                boxShadow: i === 4 ? "0 4px 12px rgba(255,107,129,0.35)" : "none",
              }}
            >
              {s.icon}
            </div>
            <span style={{ fontSize: 11, fontWeight: 600, color: "#6B7894", textAlign: "center", marginTop: 6, lineHeight: 1.3 }}>{s.label}</span>
          </div>
          {i < steps.length - 1 && <div style={{ flex: 1, height: 2, background: "#E2E8F4", minWidth: 16, marginBottom: 22 }} />}
        </React.Fragment>
      ))}
    </div>
  );
}

export default function ClientsPage() {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("risk");
  const [expanded, setExpanded] = useState(null);

  let filtered = CLIENTS.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));
  filtered = [...filtered].sort((a, b) => {
    if (sortBy === "risk") return b.risk - a.risk;
    if (sortBy === "billed") return b.totalBilled - a.totalBilled;
    return a.name.localeCompare(b.name);
  });

  const avgRisk = Math.round(CLIENTS.reduce((s, c) => s + c.risk, 0) / CLIENTS.length);
  const highRiskClients = CLIENTS.filter((c) => c.risk >= 60);

  return (
    <>
      <style>{`
        .clients-search {
          width:100%; padding:10px 16px 10px 40px; border-radius:9px;
          border:1.5px solid #E2E8F4; background:#F7F9FC;
          font-family:'Inter',sans-serif; font-size:14px; color:#2A3554; outline:none;
          transition:border-color 0.18s, box-shadow 0.18s;
        }
        .clients-search:focus { border-color:#FF9472; box-shadow:0 0 0 4px rgba(255,148,114,0.12); background:#fff; }
        .clients-search::placeholder { color:#9AA7C2; }
        .clients-select {
          font-family:'Inter',sans-serif; font-size:13px; font-weight:500; color:#2A3554;
          border:1.5px solid #E2E8F4; border-radius:8px; padding:8px 12px; background:#fff;
          cursor:pointer; outline:none;
        }
      `}</style>

      {/* TOPBAR */}
      <div style={styles.topbar}>
        <div>
          <h1 style={styles.pageTitle}>Clients</h1>
          <p style={styles.pageSubtitle}>{CLIENTS.length} clients · Avg. payment risk score {avgRisk}/100 · {highRiskClients.length} flagged high-risk</p>
        </div>
        <button className="action-btn primary">+ Add Client</button>
      </div>

      {/* EARLY WARNING SYSTEM EXPLAINER */}
      <div style={{ ...styles.card, marginBottom: 20, background: "linear-gradient(135deg,#1A1140,#3B1F73)", color: "#fff" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <span style={{ fontSize: 20 }}>🧠</span>
          <h2 style={{ ...styles.cardTitle, color: "#fff", margin: 0 }}>AI Client Risk Early Warning System</h2>
        </div>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", margin: "0 0 16px" }}>
          Every invoice is scored before it's even due — based on payment history, invoice engagement, and behavior — so risk is caught early, not after the due date.
        </p>
        <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 12, padding: "14px 16px" }}>
          <WorkflowStrip />
        </div>
      </div>

      {/* HIGH-RISK ALERTS */}
      {highRiskClients.length > 0 && (
        <div style={{ ...styles.card, marginBottom: 20, border: "1.5px solid #FEE2E2" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <span style={{ fontSize: 18 }}>🚨</span>
            <h2 style={styles.cardTitle}>Active Risk Alerts</h2>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {highRiskClients.map((c) => (
              <div key={c.email} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", background: "#FFF8F8", borderRadius: 10, border: "1px solid #FEE2E2" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ ...styles.avatar, background: `hsl(${c.name.charCodeAt(0) * 5 % 360},60%,72%)` }}>{c.avatar}</div>
                  <div>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: 13.5, color: "#1A1140" }}>{c.name}</p>
                    <p style={{ margin: "2px 0 0", fontSize: 12, color: "#B91C1C" }}>{c.action}</p>
                  </div>
                </div>
                <span style={{ ...styles.statusBadge, background: "#FEE2E2", color: "#DC2626", flexShrink: 0, marginLeft: 12 }}>Risk {c.risk}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SEARCH / SORT */}
      <div style={{ display: "flex", gap: 12, marginBottom: 18, alignItems: "center" }}>
        <div style={{ position: "relative", width: 260 }}>
          <span style={{ position: "absolute", left: 12, top: 11, fontSize: 14, color: "#9AA7C2" }}>🔍</span>
          <input className="clients-search" placeholder="Search clients..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="clients-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="risk">Sort: Risk score (high→low)</option>
          <option value="billed">Sort: Total billed</option>
          <option value="name">Sort: Name (A–Z)</option>
        </select>
      </div>

      {/* CLIENT CARDS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
        {filtered.map((c) => {
          const band = riskBand(c.risk);
          const isOpen = expanded === c.email;
          return (
            <div key={c.email} style={styles.card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <div style={{ ...styles.avatar, width: 44, height: 44, fontSize: 14, background: `hsl(${c.name.charCodeAt(0) * 5 % 360},60%,72%)` }}>
                    {c.avatar}
                  </div>
                  <div>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: 14.5, color: "#1A1140", fontFamily: "'Space Grotesk',sans-serif" }}>{c.name}</p>
                    <p style={{ margin: "2px 0 0", fontSize: 12.5, color: "#9AA7C2" }}>{c.email}</p>
                  </div>
                </div>
                <span style={{ ...styles.statusBadge, background: band.bg, color: band.color }}>{band.label}</span>
              </div>

              <div style={{ display: "flex", gap: 18, margin: "16px 0 14px" }}>
                <div>
                  <p style={{ margin: 0, fontSize: 11.5, color: "#9AA7C2", fontWeight: 600, textTransform: "uppercase" }}>Total billed</p>
                  <p style={{ margin: "3px 0 0", fontSize: 16, fontWeight: 700, color: "#1A1140" }}>{fmt(c.totalBilled)}</p>
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 11.5, color: "#9AA7C2", fontWeight: 600, textTransform: "uppercase" }}>Invoices</p>
                  <p style={{ margin: "3px 0 0", fontSize: 16, fontWeight: 700, color: "#1A1140" }}>{c.invoices}</p>
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 11.5, color: "#9AA7C2", fontWeight: 600, textTransform: "uppercase" }}>Last paid</p>
                  <p style={{ margin: "3px 0 0", fontSize: 13, fontWeight: 600, color: "#6B7894" }}>{c.lastPaid}</p>
                </div>
              </div>

              <div style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                  <span style={{ fontSize: 11.5, fontWeight: 600, color: "#9AA7C2" }}>Payment risk score</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: band.color }}>{c.risk}/100</span>
                </div>
                <div style={{ height: 7, borderRadius: 4, background: "#F0EAF8", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${c.risk}%`, background: band.color, borderRadius: 4, transition: "width 0.6s ease" }} />
                </div>
              </div>

              <button
                onClick={() => setExpanded(isOpen ? null : c.email)}
                style={{
                  width: "100%", background: "none", border: "1.5px solid #F0EAF8", borderRadius: 8, padding: "8px 0",
                  fontSize: 12.5, fontWeight: 600, color: "#5B2A9E", cursor: "pointer", fontFamily: "'Inter',sans-serif",
                }}
              >
                {isOpen ? "Hide risk factors ▲" : "Why this score? ▼"}
              </button>

              {isOpen && (
                <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid #F4F0FC" }}>
                  <p style={{ fontSize: 11.5, fontWeight: 700, color: "#9AA7C2", textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 10px" }}>
                    Risk Factors
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                    {c.factors.map((f, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                        <span style={{ width: 7, height: 7, borderRadius: "50%", background: IMPACT_COLOR[f.impact], marginTop: 5, flexShrink: 0 }} />
                        <div>
                          <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#1A1140" }}>{f.label}</p>
                          <p style={{ margin: "1px 0 0", fontSize: 12, color: "#9AA7C2" }}>{f.detail}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  {c.action && (
                    <div style={{ marginTop: 12, padding: "10px 12px", background: "#FFF8F8", borderRadius: 8, border: "1px solid #FEE2E2" }}>
                      <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: "#DC2626", textTransform: "uppercase", letterSpacing: "0.4px" }}>Suggested Action</p>
                      <p style={{ margin: "4px 0 0", fontSize: 12.5, color: "#7F1D1D" }}>{c.action}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
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
  avatar: { width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#fff", flexShrink: 0 },
  statusBadge: { padding: "4px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" },
};