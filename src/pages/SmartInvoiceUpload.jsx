import React, { useState } from "react";
import { motion } from "framer-motion";
import { api } from "../api/client";

const AGENT_API_URL = "http://127.0.0.1:8001/api/extract";

const RISK_COLOR = {
  Low: { bg: "#DCFCE7", color: "#15803D" },
  Medium: { bg: "#FEF9C3", color: "#A16207" },
  High: { bg: "#FEE2E2", color: "#B91C1C" },
};

const AGENT_PIPELINE = [
  { icon: "🔎", label: "OCR" },
  { icon: "✅", label: "Validation" },
  { icon: "🛡️", label: "Fraud" },
  { icon: "🏢", label: "Vendor" },
  { icon: "📂", label: "Category" },
  { icon: "✔️", label: "Approval" },
  { icon: "📧", label: "Email" },
  { icon: "📝", label: "Audit" },
];

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontSize: 11.5, fontWeight: 700, color: "#9AA7C2", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 10 }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #F0EAF8", fontSize: 13.5 }}>
      <span style={{ color: "#6B7894" }}>{label}</span>
      <span style={{ color: "#1A1140", fontWeight: 600, textAlign: "right", maxWidth: "60%" }}>{value ?? "—"}</span>
    </div>
  );
}

function isPdfFile(f) {
  if (!f) return false;
  if (f.type === "application/pdf") return true;
  return f.name?.toLowerCase().endsWith(".pdf");
}

export default function SmartInvoiceUpload() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [status, setStatus] = useState("idle");
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [totalAnalyzed, setTotalAnalyzed] = useState(0);

  // For "Add as Invoice" flow
  const [clients, setClients] = useState([]);
  const [showClientPicker, setShowClientPicker] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [addingInvoice, setAddingInvoice] = useState(false);
  const [addSuccess, setAddSuccess] = useState(false);
  const [addError, setAddError] = useState("");

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setResult(null);
    setStatus("idle");
    setErrorMsg("");
    setAddSuccess(false);
    setAddError("");
    setShowClientPicker(false);
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setStatus("loading");
    setErrorMsg("");
    setAddSuccess(false);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(AGENT_API_URL, { method: "POST", body: formData });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Server responded ${res.status}: ${text}`);
      }
      const data = await res.json();
      setResult(data);
      setStatus("done");
      setTotalAnalyzed((n) => n + 1);
    } catch (err) {
      setErrorMsg(
        err.message?.includes("Failed to fetch")
          ? "Couldn't reach the AI Agent server. Make sure it's running on http://127.0.0.1:8001"
          : err.message
      );
      setStatus("error");
    }
  };

  const handleOpenAddInvoice = async () => {
    setAddError("");
    setSelectedClientId("");
    setAddSuccess(false);
    try {
      const rawClients = await api.getClients();
      setClients(rawClients || []);
    } catch {
      setClients([]);
    }
    setShowClientPicker(true);
  };

  const handleAddAsInvoice = async () => {
    if (!selectedClientId) { setAddError("Please select a client"); return; }
    if (!result?.invoice) { setAddError("No invoice data to add"); return; }

    setAddingInvoice(true);
    setAddError("");
    try {
      const inv = result.invoice;
      // Parse amount — strip currency symbols/commas
      const rawAmount = String(inv.total_amount || "0").replace(/[^0-9.]/g, "");
      const amount = parseFloat(rawAmount) || 0;

      // Build a due date: if none extracted, default to 30 days from now
      let dueDate;
      try {
        const parsed = new Date(inv.invoice_date);
        if (!isNaN(parsed)) {
          parsed.setDate(parsed.getDate() + 30);
          dueDate = parsed.toISOString();
        }
      } catch {}
      if (!dueDate) {
        const d = new Date();
        d.setDate(d.getDate() + 30);
        dueDate = d.toISOString();
      }

      await api.createInvoice({
        client_id: Number(selectedClientId),
        amount,
        description: `Imported via AI Agent — Vendor: ${inv.vendor_name || "Unknown"} | Invoice #${inv.invoice_number || "N/A"} | Category: ${result.category?.expense_type || "General"}`,
        due_date: dueDate,
        category: "default",
      });

      setAddSuccess(true);
      setShowClientPicker(false);
    } catch (err) {
      setAddError(err.message || "Failed to create invoice");
    } finally {
      setAddingInvoice(false);
    }
  };

  const STATS = [
    { label: "Analyzed This Session", value: totalAnalyzed, icon: "📥", color: "#5B2A9E" },
    { label: "Fraud Risk", value: result?.fraud_check?.risk || "—", icon: "🛡️", color: "#DC2626" },
    { label: "Approval Status", value: result?.approval?.status ? result.approval.status.split(" ")[0] : "—", icon: "✔️", color: "#16A34A" },
    { label: "Agents Run", value: result ? "8 / 8" : "0 / 8", icon: "🤖", color: "#D97706" },
  ];

  const fileIsPdf = isPdfFile(file);

  return (
    <div style={{ fontFamily: "'Inter',sans-serif" }}>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px);} to{opacity:1;transform:translateY(0);} }
        .siu-stat { animation: fadeUp 0.5s ease both; }
        .siu-stat:nth-child(1){animation-delay:0.05s}
        .siu-stat:nth-child(2){animation-delay:0.10s}
        .siu-stat:nth-child(3){animation-delay:0.15s}
        .siu-stat:nth-child(4){animation-delay:0.20s}
        .action-btn { padding:9px 18px; border-radius:8px; border:none; cursor:pointer; font-family:'Inter',sans-serif; font-size:13.5px; font-weight:600; transition:transform 0.12s, filter 0.12s; }
        .action-btn:hover { transform:translateY(-1px); filter:brightness(1.07); }
        .action-btn.primary { background:linear-gradient(120deg,#FF6B81,#FF9472); color:#fff; box-shadow:0 6px 16px rgba(255,107,129,0.3); }
        .action-btn.purple { background:linear-gradient(120deg,#5B2A9E,#7C3AED); color:#fff; box-shadow:0 6px 16px rgba(91,42,158,0.25); }
        .action-btn.ghost { background:#fff; color:#5B2A9E; border:1.5px solid #E2E8F4; }
        .action-btn:disabled { opacity:0.6; cursor:not-allowed; transform:none; filter:none; }
      `}</style>

      {/* PAGE TITLE */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 24, color: "#1A1140", margin: 0, letterSpacing: "-0.4px" }}>
          Smart Invoice Upload
        </h1>
        <p style={{ fontSize: 13.5, color: "#6B7894", margin: "4px 0 0" }}>
          Upload an invoice image or PDF and let 8 AI agents extract, validate, and check it end to end.
        </p>
      </div>

      {/* STAT CARDS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 18, marginBottom: 22 }}>
        {STATS.map((s) => (
          <motion.div key={s.label} className="siu-stat"
            style={{ background: "#fff", borderRadius: 14, padding: "20px 22px", boxShadow: "0 2px 12px rgba(91,42,158,0.08)", border: "1px solid #F0EAF8" }}
            whileHover={{ y: -6, scale: 1.02 }} transition={{ type: "spring", stiffness: 300, damping: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <p style={{ fontSize: 12.5, color: "#6B7894", fontWeight: 600, letterSpacing: "0.3px", margin: "0 0 6px", textTransform: "uppercase" }}>{s.label}</p>
                <p style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 22, fontWeight: 700, color: "#1A1140", margin: 0 }}>{s.value}</p>
              </div>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: `${s.color}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 20 }}>{s.icon}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* AGENT PIPELINE STRIP */}
      <div style={{ background: "linear-gradient(135deg,#1A1140,#3B1F73)", borderRadius: 14, padding: "18px 22px", marginBottom: 22, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <span style={{ fontSize: 12.5, color: "rgba(255,255,255,0.6)", fontWeight: 600, marginRight: 4 }}>PIPELINE:</span>
        {AGENT_PIPELINE.map((a, i) => (
          <React.Fragment key={a.label}>
            <span style={{
              display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 20,
              background: result ? "rgba(255,148,114,0.25)" : "rgba(255,255,255,0.08)",
              color: result ? "#FF9472" : "rgba(255,255,255,0.55)", fontSize: 12.5, fontWeight: 600, transition: "all 0.3s",
            }}>
              {a.icon} {a.label}
            </span>
            {i < AGENT_PIPELINE.length - 1 && <span style={{ color: "rgba(255,255,255,0.25)" }}>→</span>}
          </React.Fragment>
        ))}
      </div>

      <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>

        {/* LEFT: Upload */}
        <div style={{ width: 340, flexShrink: 0 }}>
          <div style={{ background: "#fff", borderRadius: 14, padding: 22, border: "1px solid #F0EAF8", boxShadow: "0 2px 12px rgba(91,42,158,0.08)" }}>
            <label htmlFor="invoice-file" style={{
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              border: "1.5px dashed #DDD6FE", borderRadius: 12, padding: "32px 16px",
              cursor: "pointer", background: "#FAFAFA", marginBottom: 16, minHeight: 180,
            }}>
              {preview && !fileIsPdf && (
                <img src={preview} alt="Invoice preview" style={{ maxWidth: "100%", maxHeight: 200, borderRadius: 8 }} />
              )}
              {preview && fileIsPdf && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "10px 0" }}>
                  <div style={{ fontSize: 40, marginBottom: 8 }}>📕</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#1A1140", textAlign: "center", wordBreak: "break-all", maxWidth: 260 }}>
                    {file?.name}
                  </div>
                  <div style={{ fontSize: 11.5, color: "#9AA7C2", marginTop: 4 }}>PDF selected</div>
                </div>
              )}
              {!preview && (
                <>
                  <div style={{ fontSize: 30, marginBottom: 10 }}>📄</div>
                  <div style={{ fontSize: 13.5, color: "#5B2A9E", fontWeight: 600 }}>Click to choose an invoice file</div>
                  <div style={{ fontSize: 11.5, color: "#9AA7C2", marginTop: 4 }}>PNG, JPG, JPEG, or PDF</div>
                </>
              )}
            </label>
            <input id="invoice-file" type="file" accept=".png,.jpg,.jpeg,.pdf,application/pdf" onChange={handleFileChange} style={{ display: "none" }} />

            <button onClick={handleAnalyze} disabled={!file || status === "loading"}
              className="action-btn primary" style={{ width: "100%", padding: "12px" }}>
              {status === "loading" ? "⏳ Analyzing..." : "🤖 Analyze Invoice"}
            </button>

            {status === "error" && (
              <div style={{ marginTop: 14, padding: "12px 14px", borderRadius: 10, background: "#FEE2E2", color: "#B91C1C", fontSize: 12.5, lineHeight: 1.5 }}>
                ⚠️ {errorMsg}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Results */}
        <div style={{ flex: 1 }}>
          {!result && status !== "loading" && status !== "error" && (
            <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #F0EAF8", textAlign: "center", padding: "70px 20px", color: "#9AA7C2" }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>🤖</div>
              <p style={{ fontSize: 14 }}>Upload an invoice image or PDF to see the AI agents' analysis here.</p>
            </div>
          )}

          {status === "loading" && (
            <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #F0EAF8", textAlign: "center", padding: "70px 20px", color: "#9AA7C2" }}>
              <div style={{ fontSize: 28, marginBottom: 12 }}>⚙️</div>
              <p style={{ fontSize: 14, fontWeight: 600, color: "#5B2A9E" }}>Running all 8 agents...</p>
              <p style={{ fontSize: 13, color: "#9AA7C2", marginTop: 4 }}>OCR → Validation → Fraud → Vendor → Category → Approval → Email → Audit</p>
            </div>
          )}

          {result && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
              style={{ background: "#fff", borderRadius: 14, padding: 24, border: "1px solid #F0EAF8", boxShadow: "0 2px 12px rgba(91,42,158,0.08)" }}>

              <Section title="Invoice details">
                <Row label="Vendor" value={result.invoice?.vendor_name} />
                <Row label="Invoice #" value={result.invoice?.invoice_number} />
                <Row label="Date" value={result.invoice?.invoice_date} />
                <Row label="Amount" value={result.invoice?.total_amount ? `${result.invoice.currency || ""} ${result.invoice.total_amount}` : null} />
              </Section>

              <Section title="Validation">
                <Row label="Valid" value={result.validation?.is_valid ? "✅ Yes" : "❌ No"} />
                {result.validation?.errors?.length > 0 && <Row label="Errors" value={result.validation.errors.join(", ")} />}
              </Section>

              <Section title="Fraud check">
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, ...(RISK_COLOR[result.fraud_check?.risk] || RISK_COLOR.Medium) }}>
                    {result.fraud_check?.risk || "Unknown"} risk
                  </span>
                  <span style={{ fontSize: 12, color: "#9AA7C2" }}>Score: {result.fraud_check?.score ?? "—"}</span>
                </div>
                {result.fraud_check?.flags?.length > 0 && <Row label="Flags" value={result.fraud_check.flags.join(", ")} />}
              </Section>

              <Section title="Vendor verification">
                <Row label="Verified" value={result.vendor_verification?.verified ? "✅ Yes" : "❌ No"} />
                <Row label="Status" value={result.vendor_verification?.status} />
              </Section>

              <Section title="Categorization">
                <Row label="Department" value={result.category?.department} />
                <Row label="Expense type" value={result.category?.expense_type} />
              </Section>

              <Section title="Approval">
                <Row label="Status" value={result.approval?.status} />
                <Row label="Reason" value={result.approval?.reason} />
              </Section>

              {/* EMAIL DRAFT */}
              {result.email && (
                <Section title="Email draft">
                  <Row label="Subject" value={result.email?.subject} />
                  {result.email?.body && (
                    <div style={{ marginTop: 8, padding: "10px 12px", background: "#F7F9FC", borderRadius: 8, fontSize: 12.5, color: "#2A3554", lineHeight: 1.6 }}>
                      {typeof result.email.body === "string" ? result.email.body.slice(0, 200) + (result.email.body.length > 200 ? "..." : "") : "—"}
                    </div>
                  )}
                </Section>
              )}

              {/* SUCCESS BANNER */}
              {addSuccess && (
                <div style={{ marginBottom: 14, padding: "12px 16px", borderRadius: 10, background: "#DCFCE7", color: "#15803D", fontWeight: 600, fontSize: 13.5 }}>
                  ✅ Invoice added to Ledgerly successfully!
                </div>
              )}

              {/* CLIENT PICKER */}
              {showClientPicker && (
                <div style={{ marginBottom: 16, padding: "16px", background: "#F7F9FC", borderRadius: 10, border: "1.5px solid #E2E8F4" }}>
                  <p style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 600, color: "#1A1140" }}>Select a client for this invoice:</p>
                  <select
                    style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1.5px solid #E2E8F4", fontSize: 13.5, background: "#fff", marginBottom: 10 }}
                    value={selectedClientId}
                    onChange={(e) => setSelectedClientId(e.target.value)}
                  >
                    <option value="">Select client...</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}{c.state ? ` — ${c.state}` : " — no state set"}</option>
                    ))}
                  </select>
                  {addError && <p style={{ margin: "0 0 8px", fontSize: 12, color: "#DC2626" }}>{addError}</p>}
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={handleAddAsInvoice} disabled={addingInvoice} className="action-btn purple" style={{ flex: 2, padding: "10px" }}>
                      {addingInvoice ? "Adding..." : "➕ Confirm & Add Invoice"}
                    </button>
                    <button onClick={() => setShowClientPicker(false)} className="action-btn ghost" style={{ flex: 1, padding: "10px" }}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {!showClientPicker && !addSuccess && (
                <button onClick={handleOpenAddInvoice} className="action-btn purple" style={{ width: "100%", padding: "12px", marginTop: 6 }}>
                  ➕ Add as Invoice in Ledgerly
                </button>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}