import React, { useState } from "react";

const invoices = [];

const STATUS_COLOR = {
  Paid:    { bg: "#DCFCE7", color: "#15803D" },
  Pending: { bg: "#FEF9C3", color: "#A16207" },
  Overdue: { bg: "#FEE2E2", color: "#B91C1C" },
};

const STAGE_ICONS = { issued: "📤", viewed: "👁️", due: "📅", paid: "✅" };

function TrackerTimeline({ stages }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", width: "100%" }}>
      {stages.map((stage, i) => {
        const isLast = i === stages.length - 1;
        const isDone = stage.done;
        const isNext = !isDone && i > 0 && stages[i - 1].done;
        return (
          <div key={stage.key} style={{ display: "flex", alignItems: "flex-start", flex: isLast ? 0 : 1 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 72 }}>
              <div style={{
                width: 38, height: 38, borderRadius: "50%",
                background: isDone ? "linear-gradient(135deg,#FF6B81,#FF9472)" : isNext ? "#fff" : "#F4F7FC",
                border: isDone ? "none" : isNext ? "2px solid #FF9472" : "2px solid #E2E8F4",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 16,
                boxShadow: isDone ? "0 4px 12px rgba(255,107,129,0.3)" : "none",
              }}>
                <span style={{ fontSize: isDone ? 16 : 13, opacity: isDone ? 1 : 0.4 }}>
                  {STAGE_ICONS[stage.key]}
                </span>
              </div>
              <div style={{ marginTop: 6, textAlign: "center" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: isDone ? "#1A1140" : "#9AA7C2", fontFamily: "'Space Grotesk',sans-serif" }}>
                  {stage.label}
                </div>
                {stage.timestamp && (
                  <div style={{ fontSize: 10, color: "#9AA7C2", marginTop: 2, lineHeight: 1.3 }}>
                    {stage.timestamp}
                  </div>
                )}
              </div>
            </div>
            {!isLast && (
              <div style={{
                flex: 1, height: 2, marginTop: 18,
                background: isDone && stages[i + 1]?.done
                  ? "linear-gradient(90deg,#FF6B81,#FF9472)"
                  : isDone
                  ? "linear-gradient(90deg,#FF9472,#E2E8F4)"
                  : "#E2E8F4",
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function PDFModal({ invoice, onClose }) {
  const [state, setState] = useState("idle"); // idle | loading | done

  const handleDownload = () => {
    setState("loading");
    setTimeout(() => { setState("done"); setTimeout(() => setState("idle"), 2500); }, 1800);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(26,17,64,0.55)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: "#fff", borderRadius: 18, border: "1px solid #F0EAF8", width: "100%", maxWidth: 480, padding: 28, position: "relative", boxShadow: "0 20px 60px rgba(91,42,158,0.18)" }}>
        <button onClick={onClose} style={{ position: "absolute", top: 14, right: 14, background: "#F4F7FC", border: "none", color: "#6B7894", width: 30, height: 30, borderRadius: "50%", cursor: "pointer", fontSize: 16 }}>×</button>

        <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 17, color: "#1A1140", marginBottom: 2 }}>PDF Invoice</div>
        <div style={{ color: "#9AA7C2", fontSize: 13, marginBottom: 18 }}>{invoice.id} · {invoice.client}</div>

        {/* PDF Preview */}
        <div style={{ background: "#FAFAFA", border: "1px solid #F0EAF8", borderRadius: 12, padding: "20px 22px", marginBottom: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
            <div>
              <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 800, fontSize: 20, color: "#1A1140" }}>LEDGERLY</div>
              <div style={{ fontSize: 11, color: "#9AA7C2", marginTop: 1 }}>Smart Invoice Management</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 14, color: "#1A1140" }}>{invoice.id}</div>
              <div style={{ fontSize: 11, color: "#9AA7C2" }}>Issued: {invoice.issued}</div>
              <div style={{ fontSize: 11, color: "#9AA7C2" }}>Due: {invoice.due}</div>
            </div>
          </div>
          <div style={{ height: 1, background: "#F0EAF8", marginBottom: 14 }} />
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 10, color: "#9AA7C2", marginBottom: 3, fontWeight: 600 }}>BILLED TO</div>
            <div style={{ fontWeight: 600, fontSize: 13, color: "#1A1140" }}>{invoice.client}</div>
            <div style={{ fontSize: 12, color: "#6B7894" }}>{invoice.email}</div>
          </div>
          <div style={{ height: 1, background: "#F0EAF8", margin: "12px 0" }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#F7F0FF", borderRadius: 8, padding: "10px 14px" }}>
            <span style={{ fontSize: 13, color: "#5B2A9E" }}>Professional Services</span>
            <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 800, fontSize: 16, color: "#1A1140" }}>₹{invoice.amount.toLocaleString("en-IN")}</span>
          </div>
          <div style={{ marginTop: 10, padding: "8px 12px", background: "#FFF8F5", borderRadius: 8, border: "1px solid #FFE4D4" }}>
            <div style={{ fontSize: 10, color: "#9AA7C2", marginBottom: 2, fontWeight: 600 }}>TRACKER LINK</div>
            <div style={{ fontSize: 11, color: "#FF6B81", fontFamily: "monospace" }}>ledgerly.app/track/{invoice.id.toLowerCase()}</div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={handleDownload}
            style={{
              flex: 1, padding: "11px", borderRadius: 10, border: "none", cursor: "pointer",
              background: state === "done" ? "linear-gradient(120deg,#16A34A,#15803D)" : "linear-gradient(120deg,#FF6B81,#FF9472)",
              color: "#fff", fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 14,
              transition: "all 0.3s",
            }}
          >
            {state === "loading" ? "⏳ Generating..." : state === "done" ? "✅ Downloaded!" : "⬇️ Download PDF"}
          </button>
          <button
            onClick={() => navigator.clipboard?.writeText(`ledgerly.app/track/${invoice.id.toLowerCase()}`)}
            style={{ padding: "11px 16px", borderRadius: 10, border: "1.5px solid #E2E8F4", background: "#fff", color: "#5B2A9E", cursor: "pointer", fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: 13 }}
          >
            🔗 Copy Link
          </button>
        </div>
      </div>
    </div>
  );
}

export default function InvoiceTrackerPage() {
  const [selected, setSelected] = useState(invoices[0] ?? null);
  const [showPDF, setShowPDF] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [filter, setFilter] = useState("All");

  const filters = ["All", "Overdue", "Pending", "Paid"];
  const filtered = filter === "All" ? invoices : invoices.filter(i => i.status === filter);

  const stats = [
    { label: "Total Invoices", value: invoices.length, icon: "📋", color: "#5B2A9E" },
    { label: "Viewed by Client", value: invoices.filter(i => i.stages[1].done).length, icon: "👁️", color: "#0EA5E9" },
    { label: "Paid", value: invoices.filter(i => i.status === "Paid").length, icon: "✅", color: "#16A34A" },
    { label: "Not Opened Yet", value: invoices.filter(i => !i.stages[1].done).length, icon: "📭", color: "#D97706" },
  ];

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(`ledgerly.app/track/${selected.id.toLowerCase()}`);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  return (
    <div style={{ fontFamily: "'Inter',sans-serif" }}>
      {showPDF && <PDFModal invoice={selected} onClose={() => setShowPDF(false)} />}

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 24, color: "#1A1140", margin: 0, letterSpacing: "-0.4px" }}>
            Invoice Tracker
          </h1>
          <p style={{ fontSize: 13.5, color: "#6B7894", margin: "4px 0 0" }}>
            See when clients open invoices and track every payment stage in real time.
          </p>
        </div>
        <span style={{ fontSize: 12, fontWeight: 700, padding: "4px 12px", borderRadius: 20, background: "#FEE2E2", color: "#B91C1C", border: "1px solid #FECACA" }}>
          ● LIVE
        </span>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 24 }}>
        {stats.map(s => (
          <div key={s.label} style={{ background: "#fff", borderRadius: 14, padding: "18px 20px", boxShadow: "0 2px 12px rgba(91,42,158,0.08)", border: "1px solid #F0EAF8" }}>
            <div style={{ fontSize: 20, marginBottom: 8 }}>{s.icon}</div>
            <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 26, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 12, color: "#9AA7C2", marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Body */}
      <div style={{ display: "flex", gap: 20 }}>

        {/* Left: Invoice List */}
        <div style={{ flex: 1 }}>
          {/* Filters */}
          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            {filters.map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  padding: "6px 16px", borderRadius: 20,
                  border: `1.5px solid ${filter === f ? "#5B2A9E" : "#E2E8F4"}`,
                  background: filter === f ? "#F7F0FF" : "#fff",
                  color: filter === f ? "#5B2A9E" : "#6B7894",
                  fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600,
                  fontSize: 13, cursor: "pointer",
                }}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Cards */}
          {filtered.length === 0 && (
            <div style={{ textAlign: "center", padding: "48px 0", color: "#9AA7C2" }}>
              <p style={{ fontSize: 32, margin: "0 0 8px" }}>🔍</p>
              <p style={{ fontSize: 15, fontWeight: 600, color: "#4A5578", margin: "0 0 4px" }}>No invoices to track</p>
              <p style={{ fontSize: 13, margin: 0 }}>Invoices will appear here once connected to the backend.</p>
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filtered.map(inv => {
              const sc = STATUS_COLOR[inv.status];
              const viewed = inv.stages[1].done;
              const isSelected = selected?.id === inv.id;
              return (
                <div
                  key={inv.id}
                  onClick={() => setSelected(inv)}
                  style={{
                    background: "#fff",
                    border: `1.5px solid ${isSelected ? "#5B2A9E" : "#F0EAF8"}`,
                    borderRadius: 14,
                    padding: "16px 18px",
                    cursor: "pointer",
                    boxShadow: isSelected ? "0 0 0 3px rgba(91,42,158,0.1)" : "0 2px 8px rgba(91,42,158,0.06)",
                    transition: "all 0.15s",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
                        background: `hsl(${inv.client.charCodeAt(0) * 5 % 360},60%,72%)`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 12, fontWeight: 700, color: "#fff",
                      }}>{inv.avatar}</div>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
                          <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, color: "#5B2A9E", fontSize: 13.5 }}>{inv.id}</span>
                          <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 9px", borderRadius: 20, background: sc.bg, color: sc.color }}>{inv.status}</span>
                          {viewed
                            ? <span style={{ fontSize: 11, padding: "2px 9px", borderRadius: 20, background: "#EDE9FE", color: "#6D28D9", fontWeight: 600 }}>👁 Viewed</span>
                            : <span style={{ fontSize: 11, padding: "2px 9px", borderRadius: 20, background: "#FEF9C3", color: "#A16207", fontWeight: 600 }}>📭 Not Opened</span>
                          }
                        </div>
                        <div style={{ color: "#6B7894", fontSize: 12.5, marginTop: 3 }}>{inv.client}</div>
                      </div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 15, color: "#1A1140" }}>₹{inv.amount.toLocaleString("en-IN")}</div>
                      <div style={{ fontSize: 11.5, color: "#9AA7C2", marginTop: 2 }}>Due {inv.due}</div>
                    </div>
                  </div>

                  {inv.viewAlert && (
                    <div style={{
                      marginTop: 10, padding: "8px 12px", borderRadius: 8,
                      background: inv.status === "Overdue" ? "#FFF5F5" : "#FFFBEB",
                      border: `1px solid ${inv.status === "Overdue" ? "#FECACA" : "#FDE68A"}`,
                      fontSize: 12, color: inv.status === "Overdue" ? "#B91C1C" : "#92400E",
                    }}>
                      {inv.status === "Overdue" ? "⚠️" : "ℹ️"} {inv.viewAlert}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Detail Panel */}
        {selected && (
          <div style={{ width: 360, flexShrink: 0 }}>
            <div style={{ background: "#fff", borderRadius: 16, padding: 22, boxShadow: "0 2px 12px rgba(91,42,158,0.08)", border: "1px solid #F0EAF8", position: "sticky", top: 20 }}>

              {/* Invoice header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
                <div>
                  <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 800, fontSize: 18, color: "#1A1140" }}>{selected.id}</div>
                  <div style={{ color: "#6B7894", fontSize: 13, marginTop: 2 }}>{selected.client}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 800, fontSize: 20, color: "#1A1140" }}>₹{selected.amount.toLocaleString("en-IN")}</div>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: STATUS_COLOR[selected.status].bg, color: STATUS_COLOR[selected.status].color }}>
                    {selected.status}
                  </span>
                </div>
              </div>

              {/* Timeline */}
              <div style={{ background: "#F7F9FC", borderRadius: 12, padding: "16px 10px", marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#9AA7C2", textTransform: "uppercase", letterSpacing: 1, marginBottom: 14 }}>Payment Journey</div>
                <TrackerTimeline stages={selected.stages} />
              </div>

              {/* Alert */}
              {selected.viewAlert && (
                <div style={{
                  padding: "10px 14px", borderRadius: 10, marginBottom: 14,
                  background: selected.status === "Overdue" ? "#FFF5F5" : "#FFFBEB",
                  border: `1px solid ${selected.status === "Overdue" ? "#FECACA" : "#FDE68A"}`,
                  fontSize: 12.5, color: selected.status === "Overdue" ? "#B91C1C" : "#92400E",
                }}>
                  {selected.status === "Overdue" ? "⚠️" : "ℹ️"} {selected.viewAlert}
                </div>
              )}

              {/* Tracker link */}
              <div style={{ background: "#F7F0FF", border: "1px solid #EDE9FE", borderRadius: 10, padding: "12px 14px", marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: "#9AA7C2", marginBottom: 6, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8 }}>Shareable Tracker Link</div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <div style={{ flex: 1, fontFamily: "monospace", fontSize: 12, color: "#5B2A9E", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    ledgerly.app/track/{selected.id.toLowerCase()}
                  </div>
                  <button
                    onClick={handleCopyLink}
                    style={{
                      padding: "5px 12px", borderRadius: 8,
                      border: "1.5px solid #DDD6FE",
                      background: linkCopied ? "#DCFCE7" : "#fff",
                      color: linkCopied ? "#15803D" : "#5B2A9E",
                      cursor: "pointer", fontFamily: "'Space Grotesk',sans-serif",
                      fontWeight: 600, fontSize: 12, whiteSpace: "nowrap", transition: "all 0.2s",
                    }}
                  >
                    {linkCopied ? "✅ Copied!" : "🔗 Copy"}
                  </button>
                </div>
              </div>

              {/* Client preview */}
              <div style={{ background: "#FFF8F5", border: "1px solid #FFE4D4", borderRadius: 10, padding: "12px 14px", marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: "#9AA7C2", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 }}>📱 What {selected.client.split(" ")[0]} Sees</div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  {["Issued", "Viewed", "Due", "Paid"].map((stage, i) => {
                    const done = selected.stages[i]?.done;
                    return (
                      <div key={stage} style={{ textAlign: "center", flex: 1 }}>
                        <div style={{
                          width: 28, height: 28, borderRadius: "50%", margin: "0 auto 4px",
                          background: done ? "linear-gradient(135deg,#FF6B81,#FF9472)" : "#F0EAF8",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 12, color: done ? "#fff" : "#9AA7C2", fontWeight: 700,
                        }}>
                          {done ? "✓" : "·"}
                        </div>
                        <div style={{ fontSize: 10, color: done ? "#1A1140" : "#9AA7C2", fontWeight: done ? 600 : 400 }}>{stage}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={() => setShowPDF(true)}
                  style={{
                    flex: 1, padding: "11px", borderRadius: 10, border: "none", cursor: "pointer",
                    background: "linear-gradient(120deg,#FF6B81,#FF9472)",
                    color: "#fff", fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 13,
                    boxShadow: "0 4px 14px rgba(255,107,129,0.3)",
                  }}
                >
                  ⬇️ View & Download PDF
                </button>
                <button style={{
                  padding: "11px 14px", borderRadius: 10, border: "1.5px solid #E2E8F4",
                  background: "#fff", color: "#5B2A9E", cursor: "pointer",
                  fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: 13,
                }}>
                  📧 Resend
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}