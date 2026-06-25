import React, { useState } from "react";

const BAR_DATA = [
  { month: "Jan", value: 65, amount: 162000 }, { month: "Feb", value: 80, amount: 198000 },
  { month: "Mar", value: 55, amount: 137000 }, { month: "Apr", value: 90, amount: 224000 },
  { month: "May", value: 75, amount: 187000 }, { month: "Jun", value: 95, amount: 236000 },
];

const STATUS_BREAKDOWN = [
  { label: "Paid", value: 84, color: "#16A34A" },
  { label: "Pending", value: 23, color: "#D97706" },
  { label: "Overdue", value: 6, color: "#DC2626" },
  { label: "Disputed", value: 3, color: "#6D28D9" },
];

const AGENT_OUTCOMES = [
  { label: "Resolved automatically", value: 78, color: "#16A34A" },
  { label: "Extensions negotiated", value: 14, color: "#D97706" },
  { label: "Escalated to admin", value: 8, color: "#6D28D9" },
];

function fmt(n) {
  return "₹" + n.toLocaleString("en-IN");
}

function DonutChart({ data, size = 150 }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  let cumulative = 0;
  const radius = size / 2;
  const stroke = 22;
  const r = radius - stroke / 2;
  const circumference = 2 * Math.PI * r;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={radius} cy={radius} r={r} fill="none" stroke="#F0EAF8" strokeWidth={stroke} />
      {data.map((d, i) => {
        const fraction = d.value / total;
        const dash = fraction * circumference;
        const offset = (cumulative / total) * circumference;
        cumulative += d.value;
        return (
          <circle
            key={i}
            cx={radius}
            cy={radius}
            r={r}
            fill="none"
            stroke={d.color}
            strokeWidth={stroke}
            strokeDasharray={`${dash} ${circumference - dash}`}
            strokeDashoffset={-offset}
            transform={`rotate(-90 ${radius} ${radius})`}
            strokeLinecap="butt"
          />
        );
      })}
      <text x={radius} y={radius - 4} textAnchor="middle" fontSize="20" fontWeight="700" fill="#1A1140" fontFamily="'Space Grotesk',sans-serif">
        {total}
      </text>
      <text x={radius} y={radius + 14} textAnchor="middle" fontSize="10.5" fill="#9AA7C2" fontWeight="600">
        TOTAL
      </text>
    </svg>
  );
}

export default function ReportsPage() {
  const [range, setRange] = useState("6m");
  const maxAmount = Math.max(...BAR_DATA.map((b) => b.amount));
  const totalRevenue = BAR_DATA.reduce((s, b) => s + b.amount, 0);

  return (
    <>
      <style>{`
        .reports-select {
          font-family:'Inter',sans-serif; font-size:13px; font-weight:500; color:#2A3554;
          border:1.5px solid #E2E8F4; border-radius:8px; padding:8px 12px; background:#fff;
          cursor:pointer; outline:none;
        }
        .reports-select:focus { border-color:#FF9472; }
      `}</style>

      {/* TOPBAR */}
      <div style={styles.topbar}>
        <div>
          <h1 style={styles.pageTitle}>Reports</h1>
          <p style={styles.pageSubtitle}>Revenue trends, invoice breakdown, and AI agent performance</p>
        </div>
        <select className="reports-select" value={range} onChange={(e) => setRange(e.target.value)}>
          <option value="6m">Last 6 months</option>
          <option value="3m">Last 3 months</option>
          <option value="1y">Last 12 months</option>
        </select>
      </div>

      <div style={{ display: "flex", gap: 20, marginBottom: 20 }}>
        {/* REVENUE CHART */}
        <div style={{ ...styles.card, flex: 2 }}>
          <div style={styles.cardHeader}>
            <h2 style={styles.cardTitle}>Revenue Trend</h2>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#16A34A" }}>{fmt(totalRevenue)} total</span>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 16, height: 180, marginTop: 10 }}>
            {BAR_DATA.map((b, i) => (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 8, height: "100%", justifyContent: "flex-end" }}>
                <span style={{ fontSize: 11.5, fontWeight: 700, color: "#1A1140" }}>{fmt(b.amount)}</span>
                <div
                  style={{
                    width: "100%",
                    background: b.amount === maxAmount ? "linear-gradient(180deg,#FF6B81,#FF9472)" : "linear-gradient(180deg,#DDD6FE,#C4B5FD)",
                    borderRadius: "6px 6px 0 0",
                    height: `${(b.amount / maxAmount) * 100}%`,
                    transition: "height 0.6s ease",
                  }}
                />
                <span style={{ fontSize: 12, color: "#9AA7C2", fontWeight: 600 }}>{b.month}</span>
              </div>
            ))}
          </div>
        </div>

        {/* STATUS DONUT */}
        <div style={{ ...styles.card, flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <h2 style={{ ...styles.cardTitle, alignSelf: "flex-start", marginBottom: 16 }}>Invoice Status</h2>
          <DonutChart data={STATUS_BREAKDOWN} />
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 16, width: "100%" }}>
            {STATUS_BREAKDOWN.map((d, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 9, height: 9, borderRadius: "50%", background: d.color, flexShrink: 0 }} />
                <span style={{ fontSize: 12.5, color: "#2A3554", flex: 1 }}>{d.label}</span>
                <span style={{ fontSize: 12.5, fontWeight: 700, color: "#1A1140" }}>{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 20 }}>
        {/* AI AGENT PERFORMANCE */}
        <div style={{ ...styles.card, flex: 1, background: "linear-gradient(135deg,#1A1140,#3B1F73)", color: "#fff" }}>
          <h2 style={{ ...styles.cardTitle, color: "#fff", marginBottom: 16 }}>🤖 AI Agent Outcomes (last 30 days)</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {AGENT_OUTCOMES.map((d, i) => (
              <div key={i}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                  <span style={{ fontSize: 13, color: "rgba(255,255,255,0.8)" }}>{d.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#FF9472" }}>{d.value}%</span>
                </div>
                <div style={{ height: 8, borderRadius: 5, background: "rgba(255,255,255,0.12)", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${d.value}%`, background: "linear-gradient(120deg,#FF6B81,#FF9472)", borderRadius: 5, transition: "width 0.6s ease" }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SUMMARY STATS */}
        <div style={{ ...styles.card, flex: 1 }}>
          <h2 style={{ ...styles.cardTitle, marginBottom: 16 }}>Key Metrics</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {[
              { label: "Average days to payment", value: "11.2 days" },
              { label: "Average invoice value", value: fmt(28400) },
              { label: "Client retention rate", value: "94%" },
              { label: "Disputes raised this month", value: "3" },
            ].map((m, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "11px 0", borderBottom: i < 3 ? "1px solid #F4F0FC" : "none" }}>
                <span style={{ fontSize: 13.5, color: "#6B7894" }}>{m.label}</span>
                <span style={{ fontSize: 13.5, fontWeight: 700, color: "#1A1140" }}>{m.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

const styles = {
  topbar: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 26 },
  pageTitle: { fontFamily: "'Space Grotesk',sans-serif", fontSize: 24, fontWeight: 700, color: "#1A1140", margin: 0, letterSpacing: "-0.4px" },
  pageSubtitle: { fontSize: 13.5, color: "#6B7894", margin: "4px 0 0" },
  card: { background: "#fff", borderRadius: 14, padding: "22px 24px", boxShadow: "0 2px 12px rgba(91,42,158,0.08)", border: "1px solid #F0EAF8" },
  cardHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  cardTitle: { fontFamily: "'Space Grotesk',sans-serif", fontSize: 16, fontWeight: 700, color: "#1A1140", margin: 0 },
};