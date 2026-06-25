import React, { useState } from "react";

const STATUS_COLOR = {
  Paid:     { bg: "#DCFCE7", color: "#15803D" },
  Pending:  { bg: "#FEF9C3", color: "#A16207" },
  Overdue:  { bg: "#FEE2E2", color: "#B91C1C" },
  Disputed: { bg: "#EDE9FE", color: "#6D28D9" },
};

const RISK_LEVEL = (score) => {
  if (score >= 70) return { label: "High Risk", bg: "#FEE2E2", color: "#DC2626", dot: "#DC2626" };
  if (score >= 35) return { label: "Review", bg: "#FEF9C3", color: "#A16207", dot: "#D97706" };
  return { label: "Clean", bg: "#DCFCE7", color: "#15803D", dot: "#16A34A" };
};

const FLAGGED_INVOICES = [
  {
    id: "INV-1044",
    client: "Rohan Desai",
    avatar: "RD",
    amount: "₹1,85,000",
    due: "Jun 28, 2026",
    status: "Pending",
    score: 87,
    isNewClient: true,
    signals: [
      { type: "Bank details changed", detail: "Payout account changed 2 days before this invoice was issued — no prior change in 14 months on file.", weight: "high" },
      { type: "Unusual amount", detail: "₹1,85,000 is 9.4x this client's average invoice of ₹19,600.", weight: "high" },
      { type: "New client, high value", detail: "Client added 6 days ago. First invoice exceeds typical new-client threshold.", weight: "medium" },
    ],
    history: [
      { event: "Client added", time: "Jun 19, 2026 · 10:02 AM" },
      { event: "Bank account updated", time: "Jun 22, 2026 · 4:41 PM" },
      { event: "Invoice INV-1044 created", time: "Jun 24, 2026 · 9:15 AM" },
      { event: "Amount edited ₹95,000 → ₹1,85,000", time: "Jun 24, 2026 · 9:18 AM" },
    ],
  },
  {
    id: "INV-1040",
    client: "Priya Nair",
    avatar: "PN",
    amount: "₹42,000",
    due: "Jun 20, 2026",
    status: "Overdue",
    score: 48,
    isNewClient: false,
    signals: [
      { type: "Duplicate invoice number pattern", detail: "INV-1040 shares an identical line-item structure with INV-1031, sent 11 days earlier.", weight: "medium" },
      { type: "Edited after send", detail: "Due date pushed back twice after the invoice was issued.", weight: "low" },
    ],
    history: [
      { event: "Invoice INV-1040 created", time: "Jun 18, 2026 · 11:30 AM" },
      { event: "Due date edited", time: "Jun 19, 2026 · 8:02 AM" },
      { event: "Due date edited again", time: "Jun 20, 2026 · 6:47 PM" },
    ],
  },
  {
    id: "INV-1042",
    client: "Sanjay Bhatt",
    avatar: "SB",
    amount: "₹27,500",
    due: "Jun 26, 2026",
    status: "Pending",
    score: 22,
    isNewClient: false,
    signals: [
      { type: "Slight amount variance", detail: "₹27,500 is 1.6x this client's average — within normal range for this account.", weight: "low" },
    ],
    history: [
      { event: "Invoice INV-1042 created", time: "Jun 23, 2026 · 2:10 PM" },
    ],
  },
  {
    id: "INV-1036",
    client: "Sneha Pillai",
    avatar: "SP",
    amount: "₹22,500",
    due: "Jun 10, 2026",
    status: "Paid",
    score: 6,
    isNewClient: false,
    signals: [],
    history: [
      { event: "Invoice INV-1036 created", time: "Jun 5, 2026 · 9:40 AM" },
      { event: "Marked as paid", time: "Jun 10, 2026 · 3:20 PM" },
    ],
  },
];

const WEIGHT_COLOR = { high: "#DC2626", medium: "#D97706", low: "#6B7894" };

export default function FraudDetectorPage() {
  const [selectedId, setSelectedId] = useState(FLAGGED_INVOICES[0].id);
  const [filter, setFilter] = useState("All");
  const [decisions, setDecisions] = useState({});

  const selected = FLAGGED_INVOICES.find(inv => inv.id === selectedId);
  const decision = decisions[selectedId];

  const filtered = FLAGGED_INVOICES.filter(inv => {
    if (filter === "All") return true;
    if (filter === "High Risk") return inv.score >= 70;
    if (filter === "Review") return inv.score >= 35 && inv.score < 70;
    if (filter === "Clean") return inv.score < 35;
    return true;
  });

  const totalAtRisk = FLAGGED_INVOICES.filter(inv => inv.score >= 35)
    .reduce((sum, inv) => sum + parseInt(inv.amount.replace(/[₹,]/g, "")), 0);

  const highRiskCount = FLAGGED_INVOICES.filter(inv => inv.score >= 70).length;
  const reviewCount = FLAGGED_INVOICES.filter(inv => inv.score >= 35 && inv.score < 70).length;
  const confirmedFraud = Object.values(decisions).filter(d => d === "fraud").length;

  const setDecision = (id, value) => {
    setDecisions(prev => ({ ...prev, [id]: value }));
  };

  return (
    <>
      <style>{`
        .fd-filter-pill {
          padding: 7px 14px; border-radius: 8px; border: 1.5px solid #E2E8F4;
          background: #fff; font-size: 12.5px; font-weight: 600; color: #6B7894;
          cursor: pointer; transition: all 0.15s; white-space: nowrap;
        }
        .fd-filter-pill:hover { border-color: #C4B5FD; }
        .fd-filter-pill.active { background: #5B2A9E; border-color: #5B2A9E; color: #fff; }

        .fd-inv-card {
          padding: 14px 16px; border-radius: 12px; border: 1.5px solid #F0EAF8;
          background: #fff; cursor: pointer; transition: all 0.15s; margin-bottom: 10px;
        }
        .fd-inv-card:hover { border-color: #D0BDF4; box-shadow: 0 2px 10px rgba(91,42,158,0.08); }
        .fd-inv-card.selected { border-color: #5B2A9E; box-shadow: 0 2px 12px rgba(91,42,158,0.15); background: #FAF7FF; }

        .fd-signal-row {
          padding: 13px 14px; border-radius: 10px; background: #F9FAFC;
          border: 1px solid #F0EAF8; margin-bottom: 10px;
        }

        .fd-action-btn {
          flex: 1; padding: 11px 0; border-radius: 9px; font-size: 13.5px;
          font-weight: 600; cursor: pointer; border: none; transition: all 0.15s;
        }
        .fd-action-btn.clear { background: #DCFCE7; color: #15803D; }
        .fd-action-btn.clear:hover { background: #BBF7D0; }
        .fd-action-btn.fraud { background: #FEE2E2; color: #DC2626; }
        .fd-action-btn.fraud:hover { background: #FECACA; }

        .fd-score-ring { transition: stroke-dashoffset 0.6s ease; }
      `}</style>

      <div style={styles.topbar}>
        <div>
          <h1 style={styles.pageTitle}>Fake Invoice Detector</h1>
          <p style={styles.pageSubtitle}>AI-powered fraud signals across bank changes, amount anomalies, and edit history</p>
        </div>
      </div>

      {/* STAT STRIP */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <p style={styles.statLabel}>Flagged Invoices</p>
          <p style={styles.statValue}>{highRiskCount + reviewCount}</p>
          <p style={{ fontSize: 12.5, color: "#DC2626", fontWeight: 500, margin: 0 }}>🚨 {highRiskCount} high risk</p>
        </div>
        <div style={styles.statCard}>
          <p style={styles.statLabel}>Amount at Risk</p>
          <p style={styles.statValue}>₹{totalAtRisk.toLocaleString("en-IN")}</p>
          <p style={{ fontSize: 12.5, color: "#6B7894", fontWeight: 500, margin: 0 }}>Across flagged invoices</p>
        </div>
        <div style={styles.statCard}>
          <p style={styles.statLabel}>Confirmed Fraud</p>
          <p style={styles.statValue}>{confirmedFraud}</p>
          <p style={{ fontSize: 12.5, color: "#6B7894", fontWeight: 500, margin: 0 }}>Marked this session</p>
        </div>
        <div style={styles.statCard}>
          <p style={styles.statLabel}>Detection Accuracy</p>
          <p style={styles.statValue}>96.2%</p>
          <p style={{ fontSize: 12.5, color: "#16A34A", fontWeight: 500, margin: 0 }}>↑ Based on last 90 days</p>
        </div>
      </div>

      <div style={styles.twoCol}>
        {/* LEFT: INVOICE LIST */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Scanned Invoices</h2>
            <div style={{ display: "flex", gap: 8, marginTop: 14, marginBottom: 16, flexWrap: "wrap" }}>
              {["All", "High Risk", "Review", "Clean"].map(f => (
                <button key={f} className={`fd-filter-pill${filter === f ? " active" : ""}`} onClick={() => setFilter(f)}>
                  {f}
                </button>
              ))}
            </div>

            <div>
              {filtered.map(inv => {
                const risk = RISK_LEVEL(inv.score);
                return (
                  <div
                    key={inv.id}
                    className={`fd-inv-card${selectedId === inv.id ? " selected" : ""}`}
                    onClick={() => setSelectedId(inv.id)}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div style={{ display: "flex", gap: 10 }}>
                        <div style={{ ...styles.avatar, background: `hsl(${inv.client.charCodeAt(0) * 5 % 360},60%,72%)` }}>{inv.avatar}</div>
                        <div>
                          <p style={{ margin: 0, fontWeight: 700, fontSize: 13.5, color: "#1A1140" }}>{inv.id}</p>
                          <p style={{ margin: "2px 0 0", fontSize: 12.5, color: "#6B7894" }}>{inv.client}{inv.isNewClient && <span style={{ color: "#5B2A9E", fontWeight: 600 }}> · New client</span>}</p>
                        </div>
                      </div>
                      <span style={{ ...styles.statusBadge, background: risk.bg, color: risk.color, display: "flex", alignItems: "center", gap: 5 }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: risk.dot, display: "inline-block" }} />
                        {risk.label}
                      </span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
                      <span style={{ fontWeight: 600, fontSize: 13.5, color: "#1A1140" }}>{inv.amount}</span>
                      <span style={{ fontSize: 12, color: "#9AA7C2" }}>{inv.signals.length} signal{inv.signals.length !== 1 ? "s" : ""} flagged</span>
                    </div>
                  </div>
                );
              })}
              {filtered.length === 0 && (
                <p style={{ fontSize: 13, color: "#9AA7C2", textAlign: "center", padding: "20px 0" }}>No invoices in this category.</p>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT: DETAIL PANEL */}
        <div style={{ flex: 1.4, minWidth: 0 }}>
          {selected && (
            <div style={styles.card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
                <div>
                  <h2 style={styles.cardTitle}>{selected.id}</h2>
                  <p style={{ margin: "4px 0 0", fontSize: 13, color: "#6B7894" }}>{selected.client} · {selected.amount} · Due {selected.due}</p>
                </div>
                <span style={{ ...styles.statusBadge, background: STATUS_COLOR[selected.status].bg, color: STATUS_COLOR[selected.status].color }}>
                  {selected.status}
                </span>
              </div>

              {/* SCORE RING */}
              <div style={{ display: "flex", alignItems: "center", gap: 20, padding: "16px 18px", background: "#FAF7FF", borderRadius: 12, border: "1px solid #F0EAF8", marginBottom: 20 }}>
                <svg width="76" height="76" viewBox="0 0 76 76">
                  <circle cx="38" cy="38" r="32" fill="none" stroke="#F0EAF8" strokeWidth="8" />
                  <circle
                    className="fd-score-ring"
                    cx="38" cy="38" r="32" fill="none"
                    stroke={RISK_LEVEL(selected.score).dot}
                    strokeWidth="8"
                    strokeDasharray={2 * Math.PI * 32}
                    strokeDashoffset={2 * Math.PI * 32 * (1 - selected.score / 100)}
                    strokeLinecap="round"
                    transform="rotate(-90 38 38)"
                  />
                  <text x="38" y="43" textAnchor="middle" fontSize="20" fontWeight="700" fill="#1A1140" fontFamily="'Space Grotesk',sans-serif">{selected.score}</text>
                </svg>
                <div>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#1A1140" }}>Fraud Risk Score</p>
                  <p style={{ margin: "3px 0 0", fontSize: 12.5, color: "#6B7894", maxWidth: 280 }}>
                    {selected.score >= 70 && "Multiple high-weight signals detected. Recommend manual review before payout."}
                    {selected.score >= 35 && selected.score < 70 && "Some unusual patterns found. Worth a closer look, not necessarily fraudulent."}
                    {selected.score < 35 && "No significant fraud signals. Looks consistent with normal account activity."}
                  </p>
                </div>
              </div>

              {/* SIGNALS */}
              <p style={{ fontSize: 12.5, fontWeight: 700, color: "#9AA7C2", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 10 }}>
                Detected Signals {selected.signals.length === 0 && "— none"}
              </p>
              {selected.signals.map((sig, i) => (
                <div key={i} className="fd-signal-row">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <span style={{ fontSize: 13.5, fontWeight: 700, color: "#1A1140" }}>{sig.type}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: WEIGHT_COLOR[sig.weight], textTransform: "uppercase" }}>{sig.weight}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: 12.5, color: "#6B7894", lineHeight: 1.5 }}>{sig.detail}</p>
                </div>
              ))}

              {/* EDIT/ACTIVITY HISTORY */}
              <p style={{ fontSize: 12.5, fontWeight: 700, color: "#9AA7C2", textTransform: "uppercase", letterSpacing: "0.5px", margin: "20px 0 10px" }}>
                Activity Timeline
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {selected.history.map((h, i) => (
                  <div key={i} style={{ display: "flex", gap: 12, padding: "9px 0", borderBottom: i < selected.history.length - 1 ? "1px solid #F4F0FC" : "none" }}>
                    <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#5B2A9E", marginTop: 5, flexShrink: 0 }} />
                    <div>
                      <p style={{ margin: 0, fontSize: 13, color: "#2A3554", fontWeight: 500 }}>{h.event}</p>
                      <p style={{ margin: "1px 0 0", fontSize: 11.5, color: "#9AA7C2" }}>{h.time}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* ACTIONS */}
              {decision ? (
                <div style={{
                  marginTop: 20, padding: "13px 16px", borderRadius: 10,
                  background: decision === "fraud" ? "#FEE2E2" : "#DCFCE7",
                  color: decision === "fraud" ? "#B91C1C" : "#15803D",
                  fontSize: 13.5, fontWeight: 600, textAlign: "center",
                }}>
                  {decision === "fraud" ? "🚩 Marked as fraudulent — payout held" : "✅ Cleared — invoice approved"}
                </div>
              ) : (
                <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                  <button className="fd-action-btn clear" onClick={() => setDecision(selectedId, "clear")}>
                    ✅ Clear & Approve
                  </button>
                  <button className="fd-action-btn fraud" onClick={() => setDecision(selectedId, "fraud")}>
                    🚩 Mark as Fraud
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

const styles = {
  topbar: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 26 },
  pageTitle: { fontFamily: "'Space Grotesk',sans-serif", fontSize: 24, fontWeight: 700, color: "#1A1140", margin: 0, letterSpacing: "-0.4px" },
  pageSubtitle: { fontSize: 13.5, color: "#6B7894", margin: "4px 0 0" },
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 18, marginBottom: 22 },
  statCard: { background: "#fff", borderRadius: 14, padding: "20px 22px", boxShadow: "0 2px 12px rgba(91,42,158,0.08)", border: "1px solid #F0EAF8" },
  statLabel: { fontSize: 12.5, color: "#6B7894", fontWeight: 600, letterSpacing: "0.3px", margin: "0 0 6px", textTransform: "uppercase" },
  statValue: { fontFamily: "'Space Grotesk',sans-serif", fontSize: 26, fontWeight: 700, color: "#1A1140", margin: "0 0 4px", letterSpacing: "-0.5px" },
  twoCol: { display: "flex", gap: 20, alignItems: "flex-start" },
  card: { background: "#fff", borderRadius: 14, padding: "22px 24px", boxShadow: "0 2px 12px rgba(91,42,158,0.08)", border: "1px solid #F0EAF8" },
  cardTitle: { fontFamily: "'Space Grotesk',sans-serif", fontSize: 16, fontWeight: 700, color: "#1A1140", margin: 0 },
  avatar: { width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#fff", flexShrink: 0 },
  statusBadge: { padding: "4px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" },
};