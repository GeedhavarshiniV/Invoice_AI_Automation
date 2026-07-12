import React, { useState } from "react";

function Toggle({ on, onChange }) {
  return (
    <div
      onClick={() => onChange(!on)}
      style={{
        width: 42, height: 24, borderRadius: 14, position: "relative", cursor: "pointer",
        transition: "background 0.2s", flexShrink: 0,
        background: on ? "linear-gradient(120deg,#FF6B81,#FF9472)" : "#E2E8F4",
      }}
    >
      <div
        style={{
          width: 18, height: 18, borderRadius: "50%", background: "#fff", position: "absolute", top: 3,
          transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.25)", left: on ? 21 : 3,
        }}
      />
    </div>
  );
}

export default function SettingsPage({ user }) {
  const [autoExtend, setAutoExtend] = useState(true);
  const [autoDispute, setAutoDispute] = useState(true);
  const [autoEscalateHighValue, setAutoEscalateHighValue] = useState(true);
  const [notifyAdmin, setNotifyAdmin] = useState(true);
  const [notifyClient, setNotifyClient] = useState(true);

  const [maxExtensionDays, setMaxExtensionDays] = useState(15);
  const [lateThreshold, setLateThreshold] = useState(2);
  const [escalationAmount, setEscalationAmount] = useState(50000);
  const [tone, setTone] = useState("Adaptive");
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
  };

  return (
    <>
      {/* TOPBAR */}
      <div style={styles.topbar}>
        <div>
          <h1 style={styles.pageTitle}>Settings</h1>
          <p style={styles.pageSubtitle}>Configure what the AI agent can decide on its own, and when it should ask a human</p>
        </div>
        <button className="action-btn primary" onClick={handleSave}>
          {saved ? "✓ Saved" : "Save Changes"}
        </button>
      </div>

      <div style={{ display: "flex", gap: 20 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 20, flex: 1.4 }}>
          {/* AGENT PERMISSIONS */}
          <div style={styles.card}>
            <h2 style={{ ...styles.cardTitle, marginBottom: 4 }}>Agent Permissions</h2>
            <p style={{ fontSize: 13, color: "#9AA7C2", margin: "0 0 18px" }}>Actions the AI agent can take without admin approval</p>

            {[
              { key: "autoExtend", label: "Approve payment extensions automatically", desc: "Within the limits set below, based on client history", on: autoExtend, set: setAutoExtend },
              { key: "autoDispute", label: "Resolve simple disputes automatically", desc: "Duplicate charges or clear billing errors only", on: autoDispute, set: setAutoDispute },
              { key: "autoEscalateHighValue", label: "Escalate high-value requests to admin", desc: "Any request above the threshold skips automation", on: autoEscalateHighValue, set: setAutoEscalateHighValue },
            ].map((item) => (
              <div key={item.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "14px 0", borderBottom: "1px solid #F4F0FC" }}>
                <div style={{ paddingRight: 16 }}>
                  <p style={{ margin: 0, fontSize: 13.5, fontWeight: 600, color: "#1A1140" }}>{item.label}</p>
                  <p style={{ margin: "3px 0 0", fontSize: 12, color: "#9AA7C2" }}>{item.desc}</p>
                </div>
                <Toggle on={item.on} onChange={item.set} />
              </div>
            ))}
          </div>

          {/* POLICY THRESHOLDS */}
          <div style={styles.card}>
            <h2 style={{ ...styles.cardTitle, marginBottom: 4 }}>Policy Thresholds</h2>
            <p style={{ fontSize: 13, color: "#9AA7C2", margin: "0 0 18px" }}>The rules the Policy Checker agent applies before approving anything</p>

            <div style={{ marginBottom: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 13.5, fontWeight: 600, color: "#1A1140" }}>Max extension the agent can grant</span>
                <span style={{ fontSize: 13.5, fontWeight: 700, color: "#FF6B81" }}>{maxExtensionDays} days</span>
              </div>
              <input
                type="range" min="3" max="30" value={maxExtensionDays}
                onChange={(e) => setMaxExtensionDays(Number(e.target.value))}
                style={{ width: "100%", accentColor: "#FF6B81" }}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 13.5, fontWeight: 600, color: "#1A1140" }}>Late payments allowed in 6 months before flagging</span>
                <span style={{ fontSize: 13.5, fontWeight: 700, color: "#FF6B81" }}>{lateThreshold}</span>
              </div>
              <input
                type="range" min="0" max="5" value={lateThreshold}
                onChange={(e) => setLateThreshold(Number(e.target.value))}
                style={{ width: "100%", accentColor: "#FF6B81" }}
              />
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 13.5, fontWeight: 600, color: "#1A1140" }}>Escalate to admin above</span>
                <span style={{ fontSize: 13.5, fontWeight: 700, color: "#FF6B81" }}>₹{escalationAmount.toLocaleString("en-IN")}</span>
              </div>
              <input
                type="range" min="10000" max="200000" step="5000" value={escalationAmount}
                onChange={(e) => setEscalationAmount(Number(e.target.value))}
                style={{ width: "100%", accentColor: "#FF6B81" }}
              />
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20, flex: 1 }}>
          {/* AGENT TONE */}
          <div style={styles.card}>
            <h2 style={{ ...styles.cardTitle, marginBottom: 4 }}>Agent Tone</h2>
            <p style={{ fontSize: 13, color: "#9AA7C2", margin: "0 0 16px" }}>How the agent communicates with clients</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { v: "Adaptive", d: "Firm or gentle based on client relationship and history" },
                { v: "Gentle", d: "Always friendly and accommodating" },
                { v: "Firm", d: "Direct and businesslike, minimal flexibility" },
              ].map((opt) => (
                <div
                  key={opt.v}
                  onClick={() => setTone(opt.v)}
                  style={{
                    padding: "12px 14px",
                    borderRadius: 10,
                    cursor: "pointer",
                    border: tone === opt.v ? "1.5px solid #FF6B81" : "1.5px solid #F0EAF8",
                    background: tone === opt.v ? "#FFF5F4" : "#fff",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 13.5, fontWeight: 700, color: "#1A1140" }}>{opt.v}</span>
                    {tone === opt.v && <span style={{ color: "#FF6B81", fontSize: 14 }}>✓</span>}
                  </div>
                  <p style={{ margin: "3px 0 0", fontSize: 12, color: "#9AA7C2" }}>{opt.d}</p>
                </div>
              ))}
            </div>
          </div>

          {/* NOTIFICATIONS */}
          <div style={styles.card}>
            <h2 style={{ ...styles.cardTitle, marginBottom: 4 }}>Notifications</h2>
            <p style={{ fontSize: 13, color: "#9AA7C2", margin: "0 0 16px" }}>Who gets notified after the agent takes action</p>

            {[
              { label: "Notify admin", desc: "Slack/email summary of what the agent did", on: notifyAdmin, set: setNotifyAdmin },
              { label: "Notify client", desc: "Confirmation of the outcome", on: notifyClient, set: setNotifyClient },
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "12px 0", borderBottom: i === 0 ? "1px solid #F4F0FC" : "none" }}>
                <div style={{ paddingRight: 16 }}>
                  <p style={{ margin: 0, fontSize: 13.5, fontWeight: 600, color: "#1A1140" }}>{item.label}</p>
                  <p style={{ margin: "3px 0 0", fontSize: 12, color: "#9AA7C2" }}>{item.desc}</p>
                </div>
                <Toggle on={item.on} onChange={item.set} />
              </div>
            ))}
          </div>

          {/* ACCOUNT */}
          <div style={styles.card}>
            <h2 style={{ ...styles.cardTitle, marginBottom: 14 }}>Account</h2>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "#fff", background: "#FF9472" }}>
                {user?.name?.split(" ").map((w) => w[0]).join("").slice(0, 2) || "AD"}
              </div>
              <div>
                <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: "#1A1140" }}>{user?.name || "Admin"}</p>
                <p style={{ margin: 0, fontSize: 12.5, color: "#9AA7C2" }}>{user?.email || ""}</p>
              </div>
            </div>
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
  cardTitle: { fontFamily: "'Space Grotesk',sans-serif", fontSize: 16, fontWeight: 700, color: "#1A1140", margin: 0 },
};