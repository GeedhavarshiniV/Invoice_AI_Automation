import React, { useState, useEffect } from "react";
import { api } from "../api/client";

function getRiskStyle(label) {
  if (label === "Low Risk") return { color: "#16A34A", bg: "#DCFCE7", icon: "🟢" };
  if (label === "Medium Risk") return { color: "#D97706", bg: "#FEF9C3", icon: "🟡" };
  return { color: "#DC2626", bg: "#FEE2E2", icon: "🔴" };
}

function getAIMessagePreview(clientName, days, riskLevel, amount) {
  const amt = Math.round(amount || 0).toLocaleString("en-IN");
  if (riskLevel === "Low Risk") {
    return `Hi ${clientName},\n\nWe are happy to extend your payment deadline by ${days} days for the amount of Rs.${amt}.\n\nWarm regards,\nLedgerly Team`;
  }
  if (riskLevel === "Medium Risk") {
    return `Hi ${clientName},\n\nWe can offer a ${days}-day extension for Rs.${amt}. This is a one-time accommodation.\n\nRegards,\nLedgerly Team`;
  }
  return `Hi ${clientName},\n\nWe offer a limited ${days}-day extension for Rs.${amt}. Please treat this as urgent.\n\nLedgerly Collections Team`;
}

function addDaysToDate(dateStr, d) {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + d);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function fmtDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function initials(name) {
  if (!name) return "?";
  const parts = name.trim().split(" ");
  return parts.length > 1 ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() : name.slice(0, 2).toUpperCase();
}

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function SmartExtensionPage() {
  const [invoices, setInvoices] = useState([]);
  const [clients, setClients] = useState([]);
  const [extensions, setExtensions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [selectedInvoiceId, setSelectedInvoiceId] = useState("");
  const [step, setStep] = useState(1); // 1=select, 2=analyze, 3=negotiate, 4=done
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null); // result of /extensions/analyze/{id}
  const [analyzeError, setAnalyzeError] = useState("");
  const [customDays, setCustomDays] = useState(null);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [approvedResult, setApprovedResult] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setLoadError("");
      try {
        const [inv, cl, ext] = await Promise.all([
          api.getInvoices(),
          api.getClients(),
          api.getExtensions(),
        ]);
        if (cancelled) return;
        setInvoices(inv || []);
        setClients(cl || []);
        setExtensions(ext || []);
      } catch (err) {
        if (!cancelled) setLoadError(err.message || "Failed to load data");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const clientById = (id) => clients.find((c) => c.id === id);
  const invoiceById = (id) => invoices.find((i) => i.id === id);

  // Candidates: anything not already fully Paid
  const candidateInvoices = invoices.filter((i) => i.status !== "Paid");

  const selectedInvoice = invoiceById(selectedInvoiceId);
  const selectedClient = selectedInvoice ? clientById(selectedInvoice.client_id) : null;

  const risk = analysis ? getRiskStyle(analysis.risk_level) : null;
  const days = customDays ?? analysis?.suggested_days;

  const handleAnalyze = async () => {
    setAnalyzing(true);
    setAnalyzeError("");
    try {
      const data = await api.analyzeExtension(selectedInvoiceId);
      setAnalysis(data);
      setCustomDays(null);
      setStep(3);
    } catch (err) {
      setAnalyzeError(err.message || "Analysis failed");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleApprove = async () => {
    setSubmitting(true);
    setSubmitError("");
    try {
      const ext = await api.createExtension({
        invoice_id: selectedInvoiceId,
        days_extended: days,
        reason: reason || undefined,
      });
      setApprovedResult(ext);
      setExtensions((prev) => [ext, ...prev]);
      // Reflect the new due date on the invoice locally too
      setInvoices((prev) => prev.map((i) => i.id === selectedInvoiceId ? { ...i, due_date: ext.new_due_date } : i));
      setStep(4);
    } catch (err) {
      setSubmitError(err.message || "Failed to approve extension");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setStep(1);
    setSelectedInvoiceId("");
    setCustomDays(null);
    setReason("");
    setAnalysis(null);
    setAnalyzeError("");
    setSubmitError("");
    setApprovedResult(null);
  };

  // Build display-ready history rows by joining extensions -> invoices -> clients
  const historyRows = extensions.map((e) => {
    const inv = invoiceById(e.invoice_id);
    const cl = inv ? clientById(inv.client_id) : null;
    const name = cl ? cl.name : `Client on ${inv ? inv.invoice_number : "invoice #" + e.invoice_id}`;
    const riskLabel = e.risk_score >= 70 ? "Low Risk" : e.risk_score >= 45 ? "Medium Risk" : "High Risk";
    return {
      key: e.id,
      invoiceLabel: inv ? inv.invoice_number : `#${e.invoice_id}`,
      client: name,
      avatar: initials(name),
      originalDue: fmtDate(e.original_due_date),
      newDue: fmtDate(e.new_due_date),
      days: e.days_extended,
      risk: riskLabel,
      status: e.status,
      time: timeAgo(e.created_at),
    };
  });

  const avgDays = historyRows.length
    ? Math.round(historyRows.reduce((s, e) => s + e.days, 0) / historyRows.length)
    : 0;
  const lowRiskCount = historyRows.filter((e) => e.risk === "Low Risk").length;

  return (
    <div style={styles.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&display=swap');
        * { box-sizing: border-box; }

        @keyframes fadeUp { from{opacity:0;transform:translateY(10px);} to{opacity:1;transform:translateY(0);} }
        @keyframes spin { to{transform:rotate(360deg);} }
        @keyframes checkPop { 0%{transform:scale(0);opacity:0;} 70%{transform:scale(1.2);} 100%{transform:scale(1);opacity:1;} }

        .inv-select-card {
          border: 2px solid #E2E8F4; border-radius: 12px; padding: 14px 18px;
          cursor: pointer; transition: all 0.18s; background: #fff;
          display: flex; align-items: center; justify-content: space-between;
        }
        .inv-select-card:hover { border-color: #A78BFA; background: #FAF5FF; }
        .inv-select-card.selected { border-color: #5B2A9E; background: #F3EEFF; }

        .action-btn {
          padding: 12px 24px; border-radius: 10px; border: none; cursor: pointer;
          font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 700;
          transition: transform 0.12s, filter 0.12s, box-shadow 0.12s;
        }
        .action-btn:hover { transform: translateY(-2px); filter: brightness(1.07); }
        .action-btn:active { transform: scale(0.98); }
        .action-btn.primary { background: linear-gradient(120deg,#FF6B81,#FF9472); color:#fff; box-shadow:0 8px 20px rgba(255,107,129,0.35); }
        .action-btn.purple { background: linear-gradient(120deg,#5B2A9E,#7C3AED); color:#fff; box-shadow:0 8px 20px rgba(91,42,158,0.35); }
        .action-btn.ghost { background:#fff; color:#5B2A9E; border:1.5px solid #E2E8F4; }
        .action-btn:disabled { opacity:0.6; cursor:not-allowed; transform:none; }

        .day-btn {
          width: 52px; height: 52px; border-radius: 12px; border: 2px solid #E2E8F4;
          background: #fff; font-family: 'Space Grotesk', sans-serif; font-size: 16px;
          font-weight: 700; color: #6B7894; cursor: pointer; transition: all 0.15s;
          display: flex; align-items: center; justify-content: center;
        }
        .day-btn:hover { border-color: #A78BFA; color: #5B2A9E; background: #FAF5FF; }
        .day-btn.selected { border-color: #5B2A9E; background: #5B2A9E; color: #fff; }

        .history-row { transition: background 0.15s; }
        .history-row:hover { background: #F7F0FF; }

        .score-ring { transition: stroke-dashoffset 1s ease; }

        .reason-input {
          width: 100%; padding: 10px 14px; border-radius: 9px; border: 1.5px solid #E2E8F4;
          font-family: 'Inter', sans-serif; font-size: 13px; color: #2A3554; outline: none;
          resize: none; height: 60px;
        }
        .reason-input:focus { border-color: #A78BFA; }

        ::-webkit-scrollbar { width:5px; }
        ::-webkit-scrollbar-thumb { background:#D0BDF4; border-radius:6px; }
      `}</style>

      {/* TOPBAR */}
      <div style={styles.topbar}>
        <div>
          <h1 style={styles.pageTitle}>🗓 Smart Extension Negotiator</h1>
          <p style={styles.pageSubtitle}>AI-powered deadline extensions with risk analysis & auto-generated client messages</p>
        </div>
      </div>

      {loadError && (
        <div style={{ background: "#FEE2E2", color: "#B91C1C", padding: "10px 16px", borderRadius: 8, marginBottom: 16, fontSize: 13 }}>{loadError}</div>
      )}

      {/* STEP INDICATOR */}
      <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 28 }}>
        {["Select Invoice", "AI Analysis", "Negotiate", "Done"].map((s, i) => (
          <React.Fragment key={i}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: step > i + 1 ? "#16A34A" : step === i + 1 ? "#5B2A9E" : "#F0EAF8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: step >= i + 1 ? "#fff" : "#9AA7C2", transition: "all 0.3s" }}>
                {step > i + 1 ? "✓" : i + 1}
              </div>
              <span style={{ fontSize: 11.5, fontWeight: 600, color: step === i + 1 ? "#5B2A9E" : step > i + 1 ? "#16A34A" : "#9AA7C2" }}>{s}</span>
            </div>
            {i < 3 && <div style={{ flex: 1, height: 2, background: step > i + 1 ? "#16A34A" : "#F0EAF8", margin: "0 8px 18px", transition: "background 0.4s" }} />}
          </React.Fragment>
        ))}
      </div>

      <div style={styles.layout}>
        {/* MAIN PANEL */}
        <div style={{ flex: 1.4 }}>

          {/* STEP 1 — SELECT INVOICE */}
          {step === 1 && (
            <div style={styles.card}>
              <h2 style={styles.cardTitle}>Select Invoice for Extension</h2>
              <p style={{ fontSize: 13.5, color: "#9AA7C2", margin: "4px 0 20px" }}>Choose which invoice needs a deadline extension</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 420, overflowY: "auto" }}>
                {loading && (
                  <div style={{ textAlign: "center", padding: "40px 0", color: "#9AA7C2" }}>Loading invoices...</div>
                )}
                {!loading && candidateInvoices.length === 0 && (
                  <div style={{ textAlign: "center", padding: "48px 0", color: "#9AA7C2" }}>
                    <p style={{ fontSize: 32, margin: "0 0 8px" }}>🗓</p>
                    <p style={{ fontSize: 15, fontWeight: 600, color: "#4A5578", margin: "0 0 4px" }}>No invoices need extension</p>
                    <p style={{ fontSize: 13, margin: 0 }}>All invoices are either paid or not yet created.</p>
                  </div>
                )}
                {candidateInvoices.map((inv) => {
                  const c = clientById(inv.client_id);
                  const name = c ? c.name : `Client #${inv.client_id}`;
                  const score = c ? c.risk_score : 50;
                  const label = score >= 70 ? "Low Risk" : score >= 45 ? "Medium Risk" : "High Risk";
                  const r = getRiskStyle(label);
                  return (
                    <div key={inv.id} className={`inv-select-card${selectedInvoiceId === inv.id ? " selected" : ""}`} onClick={() => setSelectedInvoiceId(inv.id)}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ width: 40, height: 40, borderRadius: "50%", background: `hsl(${name.charCodeAt(0) * 5 % 360},55%,68%)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#fff" }}>{initials(name)}</div>
                        <div>
                          <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: "#1A1140" }}>{name}</p>
                          <p style={{ margin: 0, fontSize: 12.5, color: "#9AA7C2" }}>{inv.invoice_number} · ₹{Math.round(inv.amount).toLocaleString("en-IN")} · Due {fmtDate(inv.due_date)}</p>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ padding: "4px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600, background: r.bg, color: r.color }}>{r.icon} {label}</span>
                        <div style={{ width: 20, height: 20, borderRadius: "50%", border: `2px solid ${selectedInvoiceId === inv.id ? "#5B2A9E" : "#E2E8F4"}`, background: selectedInvoiceId === inv.id ? "#5B2A9E" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#fff" }}>
                          {selectedInvoiceId === inv.id && "✓"}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <button className="action-btn purple" style={{ width: "100%", marginTop: 20 }} disabled={!selectedInvoiceId} onClick={() => setStep(2)}>
                Analyze This Invoice →
              </button>
            </div>
          )}

          {/* STEP 2 — ANALYZING */}
          {step === 2 && (
            <div style={{ ...styles.card, textAlign: "center", padding: "48px 32px" }}>
              <div style={{ position: "relative", width: 100, height: 100, margin: "0 auto 24px" }}>
                <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "3px solid #F0EAF8" }} />
                <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "3px solid transparent", borderTopColor: "#5B2A9E", animation: "spin 1s linear infinite" }} />
                <div style={{ position: "absolute", inset: 8, borderRadius: "50%", border: "2px solid transparent", borderTopColor: "#FF9472", animation: "spin 0.7s linear infinite reverse" }} />
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>🤖</div>
              </div>
              <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 20, fontWeight: 700, color: "#1A1140", margin: "0 0 10px" }}>AI Analyzing Client...</h2>

              {analyzeError && (
                <div style={{ background: "#FEE2E2", color: "#B91C1C", padding: "10px 16px", borderRadius: 8, marginBottom: 16, fontSize: 13 }}>{analyzeError}</div>
              )}

              {!analyzing ? (
                <>
                  <p style={{ fontSize: 13.5, color: "#9AA7C2", margin: "0 0 28px" }}>Reviewing payment history, risk factors, and optimal extension window for {selectedClient?.name}</p>
                  <button className="action-btn purple" onClick={handleAnalyze}>Start Analysis →</button>
                </>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 300, margin: "0 auto" }}>
                  {["Fetching payment history...", "Calculating risk score...", "Determining safe extension window...", "Generating client message..."].map((t, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, background: "#F7F9FC", borderRadius: 8, padding: "9px 14px", animation: `fadeUp 0.4s ease ${i * 0.3}s both` }}>
                      <div style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid #5B2A9E", borderTopColor: "transparent", animation: "spin 0.8s linear infinite", flexShrink: 0 }} />
                      <span style={{ fontSize: 13, color: "#4A5578" }}>{t}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* STEP 3 — NEGOTIATE */}
          {step === 3 && analysis && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* RISK CARD */}
              <div style={{ ...styles.card, background: "linear-gradient(135deg,#1A1140,#3B1F73)", color: "#fff" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <p style={{ margin: "0 0 4px", fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "0.5px" }}>AI Risk Assessment</p>
                    <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 22, fontWeight: 700, color: "#fff", margin: "0 0 6px" }}>{analysis.client_name}</h2>
                    <span style={{ padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700, background: risk.bg, color: risk.color }}>{risk.icon} {analysis.risk_level}</span>
                  </div>
                  <div style={{ position: "relative", width: 90, height: 90 }}>
                    <svg viewBox="0 0 36 36" style={{ width: "100%", height: "100%", transform: "rotate(-90deg)" }}>
                      <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="3" />
                      <circle className="score-ring" cx="18" cy="18" r="15.9" fill="none"
                        stroke={risk.color} strokeWidth="3" strokeLinecap="round"
                        strokeDasharray={`${analysis.risk_score} 100`} strokeDashoffset="0" />
                    </svg>
                    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 20, fontWeight: 700, color: "#fff" }}>{analysis.risk_score}</span>
                      <span style={{ fontSize: 10, color: "rgba(255,255,255,0.6)" }}>/ 100</span>
                    </div>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10, marginTop: 18 }}>
                  <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 9, padding: "10px 12px" }}>
                    <p style={{ margin: "0 0 2px", fontSize: 11, color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>Invoice</p>
                    <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#fff", fontFamily: "'Space Grotesk',sans-serif" }}>{analysis.invoice_number}</p>
                  </div>
                  <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 9, padding: "10px 12px" }}>
                    <p style={{ margin: "0 0 2px", fontSize: 11, color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>Amount</p>
                    <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#fff", fontFamily: "'Space Grotesk',sans-serif" }}>₹{Math.round(analysis.amount).toLocaleString("en-IN")}</p>
                  </div>
                </div>
              </div>

              {/* EXTENSION PICKER */}
              <div style={styles.card}>
                <h3 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 15, fontWeight: 700, color: "#1A1140", margin: "0 0 6px" }}>Choose Extension Days</h3>
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: "#F3EEFF", borderRadius: 10, marginBottom: 16, border: "1px solid #DDD6FE" }}>
                  <span style={{ fontSize: 16 }}>🤖</span>
                  <p style={{ margin: 0, fontSize: 13, color: "#5B2A9E", fontWeight: 500 }}><strong>AI Suggests: {analysis.suggested_days} days</strong> — {analysis.suggestion_reason}</p>
                </div>
                <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
                  {[3, 5, 7, 10, 14].map((d) => (
                    <button key={d} className={`day-btn${days === d ? " selected" : ""}`} onClick={() => setCustomDays(d)}>{d}</button>
                  ))}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 16px", background: "#F7F9FC", borderRadius: 10, marginBottom: 16 }}>
                  <div>
                    <p style={{ margin: "0 0 2px", fontSize: 12, color: "#9AA7C2", fontWeight: 600 }}>ORIGINAL DUE DATE</p>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#1A1140" }}>{fmtDate(analysis.due_date)}</p>
                  </div>
                  <div style={{ fontSize: 22, color: "#C4B5FD", alignSelf: "center" }}>→</div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ margin: "0 0 2px", fontSize: 12, color: "#9AA7C2", fontWeight: 600 }}>NEW DUE DATE</p>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#16A34A" }}>{addDaysToDate(analysis.due_date, days)}</p>
                  </div>
                </div>
                <h3 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 13, fontWeight: 700, color: "#1A1140", margin: "0 0 6px" }}>Reason (optional)</h3>
                <textarea className="reason-input" placeholder="e.g. Client requested more time due to cash flow delay" value={reason} onChange={(e) => setReason(e.target.value)} />
              </div>

              {/* AUTO MESSAGE PREVIEW */}
              <div style={styles.card}>
                <h3 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 15, fontWeight: 700, color: "#1A1140", margin: "0 0 6px" }}>Auto-Generated Client Message</h3>
                <p style={{ fontSize: 12.5, color: "#9AA7C2", margin: "0 0 12px" }}>Tone adapted based on risk level — {analysis.risk_level}</p>
                <textarea readOnly value={getAIMessagePreview(analysis.client_name, days, analysis.risk_level, analysis.amount)}
                  style={{ width: "100%", padding: "14px", borderRadius: 10, border: "1.5px solid #E2E8F4", fontSize: 13, fontFamily: "'Inter',sans-serif", lineHeight: 1.7, color: "#2A3554", background: "#F7F9FC", resize: "none", outline: "none", height: 160 }} />
                {submitError && (
                  <div style={{ background: "#FEE2E2", color: "#B91C1C", padding: "10px 16px", borderRadius: 8, margin: "12px 0 0", fontSize: 13 }}>{submitError}</div>
                )}
                <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
                  <button className="action-btn ghost" style={{ flex: 1 }} onClick={handleReset} disabled={submitting}>← Back</button>
                  <button className="action-btn primary" style={{ flex: 2 }} onClick={handleApprove} disabled={submitting}>
                    {submitting ? "Sending..." : "✅ Approve & Send to Client"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4 — DONE */}
          {step === 4 && approvedResult && (
            <div style={{ ...styles.card, textAlign: "center", padding: "52px 32px" }}>
              <div style={{ width: 80, height: 80, borderRadius: "50%", background: "linear-gradient(135deg,#16A34A,#4ADE80)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: 36, animation: "checkPop 0.5s cubic-bezier(0.34,1.56,0.64,1) both" }}>✓</div>
              <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 22, fontWeight: 700, color: "#1A1140", margin: "0 0 8px" }}>Extension Approved!</h2>
              <p style={{ fontSize: 14, color: "#6B7894", margin: "0 0 6px" }}>
                <strong>{analysis?.client_name}</strong>'s deadline extended by <strong>{approvedResult.days_extended} days</strong>
              </p>
              <p style={{ fontSize: 13, color: "#16A34A", fontWeight: 600, margin: "0 0 28px" }}>New due date: {fmtDate(approvedResult.new_due_date)} · Email sent ✉️</p>
              <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                <button className="action-btn ghost" onClick={handleReset}>Process Another</button>
              </div>
            </div>
          )}
        </div>

        {/* SIDEBAR — HISTORY */}
        <div style={{ width: 300, display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={styles.card}>
            <h3 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 14, fontWeight: 700, color: "#1A1140", margin: "0 0 14px" }}>Extension History</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 0, maxHeight: 340, overflowY: "auto" }}>
              {historyRows.length === 0 && (
                <p style={{ fontSize: 13, color: "#9AA7C2", textAlign: "center", padding: "16px 0" }}>No extensions yet</p>
              )}
              {historyRows.map((e, i) => (
                <div key={e.key} className="history-row" style={{ padding: "12px 0", borderBottom: i < historyRows.length - 1 ? "1px solid #F4F0FC" : "none" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: `hsl(${e.client.charCodeAt(0) * 5 % 360},55%,68%)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#fff", flexShrink: 0 }}>{e.avatar}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontWeight: 600, fontSize: 13, color: "#1A1140", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.client}</p>
                      <p style={{ margin: 0, fontSize: 11.5, color: "#9AA7C2" }}>{e.invoiceLabel} · +{e.days} days</p>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#16A34A", background: "#DCFCE7", padding: "2px 8px", borderRadius: 10, flexShrink: 0 }}>{e.status}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, color: "#9AA7C2", paddingLeft: 42 }}>
                    <span>{e.originalDue} → {e.newDue}</span>
                    <span>{e.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ ...styles.card, background: "linear-gradient(135deg,#1A1140,#3B1F73)" }}>
            <h3 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 13, fontWeight: 700, color: "#fff", margin: "0 0 14px" }}>📊 Extension Stats</h3>
            {[
              { label: "Total Extensions", value: historyRows.length, color: "#C4B5FD" },
              { label: "Low Risk Approvals", value: lowRiskCount, color: "#4ADE80" },
              { label: "Avg Days Given", value: `${avgDays}d`, color: "#FCD34D" },
            ].map((s, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: i < 2 ? "1px solid rgba(255,255,255,0.08)" : "none" }}>
                <span style={{ fontSize: 12.5, color: "rgba(255,255,255,0.65)" }}>{s.label}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: s.color, fontFamily: "'Space Grotesk',sans-serif" }}>{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { fontFamily: "'Inter',sans-serif", padding: "28px 32px", minHeight: "100vh", background: "#F4F7FC" },
  topbar: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 },
  pageTitle: { fontFamily: "'Space Grotesk',sans-serif", fontSize: 24, fontWeight: 700, color: "#1A1140", margin: 0, letterSpacing: "-0.4px" },
  pageSubtitle: { fontSize: 13.5, color: "#6B7894", margin: "4px 0 0" },
  layout: { display: "flex", gap: 20, alignItems: "flex-start" },
  card: { background: "#fff", borderRadius: 14, padding: "22px 24px", boxShadow: "0 2px 12px rgba(91,42,158,0.07)", border: "1px solid #F0EAF8" },
  cardTitle: { fontFamily: "'Space Grotesk',sans-serif", fontSize: 17, fontWeight: 700, color: "#1A1140", margin: "0 0 4px" },
};