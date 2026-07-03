import React, { useState, useEffect } from "react";
import { api } from "../api/client";

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

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa",
  "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala",
  "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland",
  "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
  "Uttar Pradesh", "Uttarakhand", "West Bengal", "Delhi", "Jammu and Kashmir",
  "Ladakh", "Chandigarh", "Puducherry",
];

function fmt(n) {
  return "₹" + Math.round(n || 0).toLocaleString("en-IN");
}

function initials(name) {
  if (!name) return "?";
  const parts = name.trim().split(" ");
  return parts.length > 1
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase();
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function buildFactors(clientInvoices) {
  const factors = [];
  const overdue = clientInvoices.filter((inv) => inv.status === "Overdue");
  const paid = clientInvoices.filter((inv) => inv.status === "Paid");
  const pending = clientInvoices.filter((inv) => inv.status === "Pending");
  const avgFraud = clientInvoices.length
    ? clientInvoices.reduce((s, inv) => s + (inv.fraud_score || 0), 0) / clientInvoices.length
    : 0;

  if (overdue.length > 0) {
    factors.push({
      impact: "high",
      label: `${overdue.length} overdue invoice${overdue.length > 1 ? "s" : ""}`,
      detail: `Totaling ${fmt(overdue.reduce((s, i) => s + i.amount, 0))} past due date`,
    });
  }
  if (paid.length > 0) {
    factors.push({
      impact: "low",
      label: `${paid.length} invoice${paid.length > 1 ? "s" : ""} paid on record`,
      detail: "Positive payment history",
    });
  }
  if (pending.length > 0) {
    factors.push({
      impact: "medium",
      label: `${pending.length} invoice${pending.length > 1 ? "s" : ""} pending`,
      detail: "Awaiting payment, not yet overdue",
    });
  }
  if (avgFraud > 0) {
    factors.push({
      impact: avgFraud > 60 ? "high" : avgFraud > 30 ? "medium" : "low",
      label: `Average fraud score: ${avgFraud.toFixed(0)}/100`,
      detail: "Based on invoice pattern analysis",
    });
  }
  if (factors.length === 0) {
    factors.push({
      impact: "low",
      label: "No invoice history yet",
      detail: "Risk score is a baseline estimate for a new client",
    });
  }
  return factors;
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
            <div style={{
              width: 42, height: 42, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 18, background: i === 3 ? "#FEE2E2" : i === 4 ? "linear-gradient(120deg,#FF6B81,#FF9472)" : "#F4F0FC",
              boxShadow: i === 4 ? "0 4px 12px rgba(255,107,129,0.35)" : "none",
            }}>
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
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // State-editing
  const [editingStateFor, setEditingStateFor] = useState(null);
  const [stateDraft, setStateDraft] = useState("");
  const [savingState, setSavingState] = useState(false);
  const [stateError, setStateError] = useState("");

  // Add client modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ name: "", email: "", company: "", state: "" });
  const [addError, setAddError] = useState("");
  const [addingClient, setAddingClient] = useState(false);

  async function loadClients() {
    setLoading(true);
    setError("");
    try {
      const [rawClients, rawInvoices] = await Promise.all([
        api.getClients(),
        api.getInvoices(),
      ]);

      const enriched = (rawClients || []).map((c) => {
        const clientInvoices = (rawInvoices || []).filter((inv) => inv.client_id === c.id);
        const totalBilled = clientInvoices.reduce((s, inv) => s + (inv.amount || 0), 0);
        const paidInvoices = clientInvoices.filter((inv) => inv.status === "Paid" && inv.paid_date);
        const lastPaid = paidInvoices.length
          ? paidInvoices.reduce((latest, inv) => (new Date(inv.paid_date) > new Date(latest) ? inv.paid_date : latest), paidInvoices[0].paid_date)
          : null;

        return {
          id: c.id,
          name: c.name,
          email: c.email,
          company: c.company,
          state: c.state || "",
          avatar: initials(c.name),
          risk: Math.round(c.risk_score || 0),
          status: c.status,
          totalBilled,
          invoices: clientInvoices.length,
          lastPaid: lastPaid ? formatDate(lastPaid) : "No payments yet",
          factors: buildFactors(clientInvoices),
          action: clientInvoices.some((inv) => inv.status === "Overdue")
            ? "Follow up on overdue invoices recommended"
            : null,
        };
      });

      setClients(enriched);
    } catch (err) {
      setError(err.message || "Failed to load clients");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadClients(); }, []);

  function startEditState(c) {
    setStateError("");
    setEditingStateFor(c.id);
    setStateDraft(c.state || "");
  }

  function cancelEditState() {
    setEditingStateFor(null);
    setStateDraft("");
    setStateError("");
  }

  async function saveState(clientId) {
    if (!stateDraft) { setStateError("Pick a state"); return; }
    setSavingState(true);
    setStateError("");
    try {
      await api.updateClientState(clientId, stateDraft);
      setClients((prev) => prev.map((c) => (c.id === clientId ? { ...c, state: stateDraft } : c)));
      setEditingStateFor(null);
      setStateDraft("");
    } catch (err) {
      setStateError(err.message || "Failed to update state");
    } finally {
      setSavingState(false);
    }
  }

  async function handleAddClient() {
    setAddError("");
    if (!addForm.name.trim()) { setAddError("Name is required"); return; }
    if (!addForm.email.trim()) { setAddError("Email is required"); return; }
    setAddingClient(true);
    try {
      await api.createClient({
        name: addForm.name.trim(),
        email: addForm.email.trim(),
        company: addForm.company.trim() || null,
        state: addForm.state || null,
      });
      setShowAddModal(false);
      setAddForm({ name: "", email: "", company: "", state: "" });
      await loadClients();
    } catch (err) {
      setAddError(err.message || "Failed to add client");
    } finally {
      setAddingClient(false);
    }
  }

  let filtered = clients.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));
  filtered = [...filtered].sort((a, b) => {
    if (sortBy === "risk") return b.risk - a.risk;
    if (sortBy === "billed") return b.totalBilled - a.totalBilled;
    return a.name.localeCompare(b.name);
  });

  const avgRisk = clients.length ? Math.round(clients.reduce((s, c) => s + c.risk, 0) / clients.length) : 0;
  const highRiskClients = clients.filter((c) => c.risk >= 60);
  const noStateClients = clients.filter((c) => !c.state);

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "80px 0", color: "#9AA7C2" }}>
        <p style={{ fontSize: 14 }}>Loading clients...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: "center", padding: "80px 0" }}>
        <p style={{ fontSize: 14, color: "#DC2626", fontWeight: 600 }}>Couldn't load clients</p>
        <p style={{ fontSize: 13, color: "#9AA7C2", marginTop: 4 }}>{error}</p>
      </div>
    );
  }

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
        .state-select {
          font-family:'Inter',sans-serif; font-size:12.5px; font-weight:500; color:#2A3554;
          border:1.5px solid #E2E8F4; border-radius:7px; padding:6px 8px; background:#fff;
          cursor:pointer; outline:none;
        }
        .action-btn { padding:9px 18px; border-radius:8px; border:none; cursor:pointer; font-family:'Inter',sans-serif; font-size:13.5px; font-weight:600; transition:transform 0.12s, filter 0.12s; }
        .action-btn:hover { transform:translateY(-1px); filter:brightness(1.07); }
        .action-btn.primary { background:linear-gradient(120deg,#FF6B81,#FF9472); color:#fff; box-shadow:0 6px 16px rgba(255,107,129,0.3); }
        .action-btn.ghost { background:#fff; color:#5B2A9E; border:1.5px solid #E2E8F4; }
        .action-btn:disabled { opacity:0.6; cursor:not-allowed; }
        .modal-overlay { position:fixed; inset:0; background:rgba(26,17,64,0.5); z-index:999; display:flex; align-items:center; justify-content:center; backdrop-filter:blur(4px); }
        .modal-box { background:#fff; border-radius:18px; padding:32px; width:480px; max-width:95vw; box-shadow:0 24px 60px rgba(26,17,64,0.25); max-height:90vh; overflow-y:auto; }
      `}</style>

      {/* TOPBAR */}
      <div style={styles.topbar}>
        <div>
          <h1 style={styles.pageTitle}>Clients</h1>
          <p style={styles.pageSubtitle}>{clients.length} clients · Avg. payment risk score {avgRisk}/100 · {highRiskClients.length} flagged high-risk</p>
        </div>
        <button className="action-btn primary" onClick={() => { setAddError(""); setAddForm({ name: "", email: "", company: "", state: "" }); setShowAddModal(true); }}>+ Add Client</button>
      </div>

      {/* MISSING STATE WARNING */}
      {noStateClients.length > 0 && (
        <div style={{ ...styles.card, marginBottom: 20, border: "1.5px solid #FEF3C7", background: "#FFFBEB" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 16 }}>⚠️</span>
            <p style={{ margin: 0, fontSize: 13, color: "#92400E" }}>
              {noStateClients.length} client{noStateClients.length > 1 ? "s have" : " has"} no state set — GST can't be calculated for their invoices until you set it below.
            </p>
          </div>
        </div>
      )}

      {/* EARLY WARNING SYSTEM */}
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
                    <p style={{ margin: "2px 0 0", fontSize: 12, color: "#B91C1C" }}>{c.action || "High risk score — review recommended"}</p>
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
      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "64px 0", color: "#9AA7C2" }}>
          <p style={{ fontSize: 32, margin: "0 0 8px" }}>👥</p>
          <p style={{ fontSize: 15, fontWeight: 600, color: "#4A5578", margin: "0 0 4px" }}>No clients yet</p>
          <p style={{ fontSize: 13, margin: 0 }}>Click "+ Add Client" to add your first client.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
          {filtered.map((c) => {
            const band = riskBand(c.risk);
            const isOpen = expanded === c.email;
            const isEditingState = editingStateFor === c.id;
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
                      {c.company && <p style={{ margin: "2px 0 0", fontSize: 12, color: "#6B7894" }}>{c.company}</p>}
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

                {/* STATE / GST FIELD */}
                <div style={{ marginBottom: 14, padding: "10px 12px", background: "#F7F9FC", borderRadius: 9, border: "1px solid #F0EAF8" }}>
                  <p style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 700, color: "#9AA7C2", textTransform: "uppercase", letterSpacing: "0.4px" }}>
                    State (for GST)
                  </p>
                  {isEditingState ? (
                    <div>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <select
                          className="state-select"
                          style={{ flex: 1 }}
                          value={stateDraft}
                          onChange={(e) => setStateDraft(e.target.value)}
                        >
                          <option value="">Select state...</option>
                          {INDIAN_STATES.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                        <button onClick={() => saveState(c.id)} disabled={savingState} className="action-btn primary" style={{ padding: "6px 12px", fontSize: 12 }}>
                          {savingState ? "Saving..." : "Save"}
                        </button>
                        <button onClick={cancelEditState} disabled={savingState} style={{ background: "none", border: "1.5px solid #E2E8F4", borderRadius: 7, padding: "6px 12px", fontSize: 12, fontWeight: 600, color: "#6B7894", cursor: "pointer" }}>
                          Cancel
                        </button>
                      </div>
                      {stateError && <p style={{ margin: "6px 0 0", fontSize: 12, color: "#DC2626" }}>{stateError}</p>}
                    </div>
                  ) : (
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      {c.state ? (
                        <span style={{ fontSize: 13, fontWeight: 600, color: "#1A1140" }}>{c.state}</span>
                      ) : (
                        <span style={{ fontSize: 13, color: "#D97706", fontWeight: 600 }}>⚠ Not set</span>
                      )}
                      <button onClick={() => startEditState(c)} style={{ background: "none", border: "1.5px solid #E2E8F4", borderRadius: 7, padding: "5px 12px", fontSize: 12, fontWeight: 600, color: "#5B2A9E", cursor: "pointer" }}>
                        {c.state ? "Edit" : "Set state"}
                      </button>
                    </div>
                  )}
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
                  style={{ width: "100%", background: "none", border: "1.5px solid #F0EAF8", borderRadius: 8, padding: "8px 0", fontSize: 12.5, fontWeight: 600, color: "#5B2A9E", cursor: "pointer", fontFamily: "'Inter',sans-serif" }}
                >
                  {isOpen ? "Hide risk factors ▲" : "Why this score? ▼"}
                </button>

                {isOpen && (
                  <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid #F4F0FC" }}>
                    <p style={{ fontSize: 11.5, fontWeight: 700, color: "#9AA7C2", textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 10px" }}>Risk Factors</p>
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
      )}

      {/* ADD CLIENT MODAL */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 20, fontWeight: 700, color: "#1A1140", margin: 0 }}>Add New Client</h2>
              <button onClick={() => setShowAddModal(false)} style={{ background: "none", border: "none", fontSize: 22, color: "#9AA7C2", cursor: "pointer" }}>×</button>
            </div>

            {addError && (
              <div style={{ background: "#FEE2E2", color: "#B91C1C", padding: "10px 14px", borderRadius: 8, marginBottom: 16, fontSize: 13 }}>{addError}</div>
            )}

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#2A3554", display: "block", marginBottom: 6 }}>Name <span style={{ color: "#DC2626" }}>*</span></label>
              <input
                type="text"
                placeholder="e.g. Ravi Kumar"
                style={{ width: "100%", padding: "11px 14px", borderRadius: 9, border: "1.5px solid #E2E8F4", fontSize: 14, background: "#F7F9FC", outline: "none", boxSizing: "border-box" }}
                value={addForm.name}
                onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#2A3554", display: "block", marginBottom: 6 }}>Email <span style={{ color: "#DC2626" }}>*</span></label>
              <input
                type="email"
                placeholder="e.g. ravi@company.com"
                style={{ width: "100%", padding: "11px 14px", borderRadius: 9, border: "1.5px solid #E2E8F4", fontSize: 14, background: "#F7F9FC", outline: "none", boxSizing: "border-box" }}
                value={addForm.email}
                onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#2A3554", display: "block", marginBottom: 6 }}>Company <span style={{ fontSize: 11, color: "#9AA7C2", fontWeight: 400 }}>(optional)</span></label>
              <input
                type="text"
                placeholder="e.g. Ravi Enterprises"
                style={{ width: "100%", padding: "11px 14px", borderRadius: 9, border: "1.5px solid #E2E8F4", fontSize: 14, background: "#F7F9FC", outline: "none", boxSizing: "border-box" }}
                value={addForm.company}
                onChange={(e) => setAddForm({ ...addForm, company: e.target.value })}
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#2A3554", display: "block", marginBottom: 6 }}>State <span style={{ fontSize: 11, color: "#9AA7C2", fontWeight: 400 }}>(for GST — recommended)</span></label>
              <select
                style={{ width: "100%", padding: "11px 14px", borderRadius: 9, border: "1.5px solid #E2E8F4", fontSize: 14, background: "#F7F9FC", outline: "none", cursor: "pointer", boxSizing: "border-box" }}
                value={addForm.state}
                onChange={(e) => setAddForm({ ...addForm, state: e.target.value })}
              >
                <option value="">Select state...</option>
                {INDIAN_STATES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setShowAddModal(false)} className="action-btn ghost" style={{ flex: 1 }}>Cancel</button>
              <button onClick={handleAddClient} disabled={addingClient} className="action-btn primary" style={{ flex: 2 }}>
                {addingClient ? "Adding..." : "Add Client"}
              </button>
            </div>
          </div>
        </div>
      )}
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