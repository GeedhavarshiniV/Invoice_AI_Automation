import React, { useState } from "react";

const invoices = [ ];

const STATUS_COLOR = {
  Paid:    { bg: "#DCFCE7", color: "#15803D" },
  Pending: { bg: "#FEF9C3", color: "#A16207" },
  Overdue: { bg: "#FEE2E2", color: "#B91C1C" },
};

const TONE_CONFIG = {
  Friendly: {
    color: "#16A34A",
    bg: "#DCFCE7",
    border: "#86EFAC",
    icon: "😊",
    label: "Friendly",
    desc: "Warm, polite — best for first reminder",
    recommended: 0,
  },
  Firm: {
    color: "#D97706",
    bg: "#FEF9C3",
    border: "#FCD34D",
    icon: "📋",
    label: "Firm",
    desc: "Professional, direct — second reminder",
    recommended: 1,
  },
  Urgent: {
    color: "#B91C1C",
    bg: "#FEE2E2",
    border: "#FCA5A5",
    icon: "🚨",
    label: "Urgent",
    desc: "Escalation warning — third reminder+",
    recommended: 2,
  },
};

function generateMessage(invoice, tone) {
  const first = invoice.client.split(" ")[0];
  const amt = `₹${invoice.amount.toLocaleString("en-IN")}`;

  if (tone === "Friendly") {
    return `Hi ${first},

Hope you're doing well! This is a gentle reminder that invoice ${invoice.id} for ${amt} was due on ${invoice.due}.

If you've already processed the payment, please ignore this message. Otherwise, you can pay instantly using the link below — it only takes a moment.

[Pay Now — ${amt}]

Feel free to reach out if you have any questions. We're happy to help!

Warm regards,
Ledgerly Team`;
  }

  if (tone === "Firm") {
    return `Dear ${first},

This is a follow-up regarding invoice ${invoice.id} for ${amt}, which remains unpaid as of ${invoice.due}.

We kindly request you to process the payment at your earliest convenience to avoid any disruption to your account. You can complete the payment securely using the link below.

[Pay Now — ${amt}]

If there's an issue with the invoice or you require an extension, please reply to this message and we'll assist you promptly.

Regards,
Ledgerly Team`;
  }

  return `Dear ${first},

Despite our previous reminders, invoice ${invoice.id} for ${amt} remains outstanding — now ${invoice.daysOverdue} days overdue.

This is our final notice before we escalate this matter. To avoid late fees and further action, please make payment immediately using the secure link below.

[Pay Now — ${amt}]

If you believe this is an error or wish to discuss a payment arrangement, contact us within 24 hours.

Ledgerly Accounts Team`;
}

function getSuggestedTone(remindersSent) {
  if (remindersSent === 0) return "Friendly";
  if (remindersSent === 1) return "Firm";
  return "Urgent";
}

function SendConfirmModal({ invoice, tone, sendTime, onClose, onConfirm }) {
  const tc = TONE_CONFIG[tone];
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(26,17,64,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: "#fff", borderRadius: 18, border: "1px solid #F0EAF8", width: "100%", maxWidth: 420, padding: 28, boxShadow: "0 20px 60px rgba(91,42,158,0.18)" }}>
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>{tc.icon}</div>
          <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 18, color: "#1A1140" }}>Send {tone} Reminder?</div>
          <div style={{ color: "#6B7894", fontSize: 13, marginTop: 4 }}>This will be sent to {invoice.client} at {sendTime}</div>
        </div>
        <div style={{ background: "#F7F9FC", borderRadius: 10, padding: "12px 14px", marginBottom: 20 }}>
          {[
            { label: "Invoice", value: invoice.id },
            { label: "Client", value: invoice.client },
            { label: "Amount", value: `₹${invoice.amount.toLocaleString("en-IN")}` },
            { label: "Tone", value: tone },
            { label: "Send Time", value: sendTime },
          ].map(r => (
            <div key={r.label} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid #F0EAF8" }}>
              <span style={{ fontSize: 13, color: "#9AA7C2", fontWeight: 600 }}>{r.label}</span>
              <span style={{ fontSize: 13, color: "#1A1140", fontWeight: 600 }}>{r.value}</span>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "11px", borderRadius: 10, border: "1.5px solid #E2E8F4", background: "#fff", color: "#6B7894", cursor: "pointer", fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: 14 }}>Cancel</button>
          <button onClick={onConfirm} style={{ flex: 1, padding: "11px", borderRadius: 10, border: "none", background: "linear-gradient(120deg,#FF6B81,#FF9472)", color: "#fff", cursor: "pointer", fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 14, boxShadow: "0 4px 14px rgba(255,107,129,0.3)" }}>
            ✉️ Send Now
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DeadlineMessagesPage() {
  const [invoiceList, setInvoiceList] = useState(invoices);
  const [selected, setSelected] = useState(invoices[0] ?? null);
  const [tone, setTone] = useState(invoices[0] ? getSuggestedTone(invoices[0].remindersSent) : "Friendly");
  const [showConfirm, setShowConfirm] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);

  // No invoices yet (e.g. not connected to the backend) — short-circuit
  // before any of the logic below, which assumes `selected` exists.
  if (!selected) {
    return (
      <>
        <div style={{ marginBottom: 24 }}>
          <div>
            <h1 style={{
                fontFamily: "'Space Grotesk',sans-serif",
                fontWeight: 700,
                fontSize: 24,
                color: "#1A1140",
                margin: 0,
              }}>Deadline Messages</h1>
            <p style={{
               fontSize: 13.5,
               color: "#6B7894",
              margin: "4px 0 0",
              }}>Automatic reminders before and after due dates</p>
          </div>  
        </div>
        <div style={{ textAlign: "center", padding: "64px 0", color: "#9AA7C2" }}>
          <p style={{ fontSize: 32, margin: "0 0 8px" }}>⏰</p>
          <p style={{ fontSize: 15, fontWeight: 600, color: "#4A5578", margin: "0 0 4px" }}>No invoices to remind</p>
          <p style={{ fontSize: 13, margin: 0 }}>Reminder schedules will appear here once connected to the backend.</p>
        </div>
      </>
    );
  }

  const suggestedTone = getSuggestedTone(selected.remindersSent);
  const message = generateMessage(selected, tone);
  const sendTime = `Today · ${selected.avgOpenTime} (${selected.avgOpenDay})`;

  const handleSelectInvoice = (inv) => {
    setSelected(inv);
    setTone(getSuggestedTone(inv.remindersSent));
    setSentSuccess(false);
  };

  const handleConfirmSend = () => {
    const newHistory = {
      tone,
      sent: `Jun 25, 2026 · ${selected.avgOpenTime}`,
      opened: false,
      openedAt: null,
    };
    const updated = invoiceList.map(inv =>
      inv.id === selected.id
        ? { ...inv, remindersSent: inv.remindersSent + 1, history: [...inv.history, newHistory] }
        : inv
    );
    setInvoiceList(updated);
    const updatedSelected = updated.find(i => i.id === selected.id);
    setSelected(updatedSelected);
    setTone(getSuggestedTone(updatedSelected.remindersSent));
    setShowConfirm(false);
    setSentSuccess(true);
    setTimeout(() => setSentSuccess(false), 3500);
  };

  const stats = [
    { label: "Reminders Sent", value: invoiceList.reduce((a, i) => a + i.remindersSent, 0), icon: "📨", color: "#5B2A9E" },
    { label: "Opened by Client", value: invoiceList.reduce((a, i) => a + i.history.filter(h => h.opened).length, 0), icon: "👁️", color: "#0EA5E9" },
    { label: "Pending Reminders", value: invoiceList.filter(i => i.status !== "Paid").length, icon: "⏳", color: "#D97706" },
    { label: "Overdue Invoices", value: invoiceList.filter(i => i.status === "Overdue").length, icon: "🚨", color: "#DC2626" },
  ];

  return (
    <div style={{ fontFamily: "'Inter',sans-serif" }}>
      {showConfirm && (
        <SendConfirmModal
          invoice={selected}
          tone={tone}
          sendTime={sendTime}
          onClose={() => setShowConfirm(false)}
          onConfirm={handleConfirmSend}
        />
      )}

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 24, color: "#1A1140", margin: 0, letterSpacing: "-0.4px" }}>
            Deadline Messages
          </h1>
          <p style={{ fontSize: 13.5, color: "#6B7894", margin: "4px 0 0" }}>
            AI picks the right tone, right time — every reminder feels human, not automated.
          </p>
        </div>
        <span style={{ fontSize: 12, fontWeight: 700, padding: "4px 12px", borderRadius: 20, background: "#EDE9FE", color: "#6D28D9", border: "1px solid #DDD6FE" }}>
          🤖 AI-Powered
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

      {/* Success banner */}
      {sentSuccess && (
        <div style={{ background: "#DCFCE7", border: "1.5px solid #86EFAC", borderRadius: 12, padding: "12px 18px", marginBottom: 18, display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 18 }}>✅</span>
          <div>
            <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 14, color: "#15803D" }}>Reminder sent successfully!</span>
            <span style={{ fontSize: 13, color: "#16A34A", marginLeft: 8 }}>Scheduled for {selected.avgOpenTime} — the time {selected.client.split(" ")[0]} usually opens emails.</span>
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 20 }}>

        {/* Left: Invoice list */}
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 13, color: "#9AA7C2", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>
            Select Invoice
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {invoiceList.filter(i => i.status !== "Paid").map(inv => {
              const sc = STATUS_COLOR[inv.status];
              const sugTone = getSuggestedTone(inv.remindersSent);
              const tc = TONE_CONFIG[sugTone];
              const isSelected = selected?.id === inv.id;
              return (
                <div
                  key={inv.id}
                  onClick={() => handleSelectInvoice(inv)}
                  style={{
                    background: "#fff",
                    border: `1.5px solid ${isSelected ? "#5B2A9E" : "#F0EAF8"}`,
                    borderRadius: 14, padding: "16px 18px", cursor: "pointer",
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
                        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                          <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, color: "#5B2A9E", fontSize: 13.5 }}>{inv.id}</span>
                          <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 9px", borderRadius: 20, background: sc.bg, color: sc.color }}>{inv.status}</span>
                        </div>
                        <div style={{ color: "#6B7894", fontSize: 12.5, marginTop: 2 }}>{inv.client} · Due {inv.due}</div>
                      </div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 15, color: "#1A1140" }}>₹{inv.amount.toLocaleString("en-IN")}</div>
                      <div style={{ fontSize: 11, color: "#9AA7C2", marginTop: 2 }}>{inv.remindersSent} sent</div>
                    </div>
                  </div>

                  {/* AI suggestion strip */}
                  <div style={{ marginTop: 10, display: "flex", alignItems: "center", justifyContent: "space-between", background: "#F7F9FC", borderRadius: 8, padding: "7px 10px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 13 }}>🤖</span>
                      <span style={{ fontSize: 12, color: "#6B7894" }}>AI suggests:</span>
                      <span style={{ fontSize: 12, fontWeight: 700, padding: "2px 9px", borderRadius: 20, background: tc.bg, color: tc.color, border: `1px solid ${tc.border}` }}>
                        {tc.icon} {sugTone}
                      </span>
                    </div>
                    <span style={{ fontSize: 11.5, color: "#9AA7C2" }}>Best time: {inv.avgOpenTime}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Send history */}
          {selected.history.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 13, color: "#9AA7C2", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>
                Reminder History — {selected.id}
              </div>
              <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #F0EAF8", overflow: "hidden", boxShadow: "0 2px 8px rgba(91,42,158,0.06)" }}>
                {selected.history.map((h, i) => {
                  const tc = TONE_CONFIG[h.tone];
                  return (
                    <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: i < selected.history.length - 1 ? "1px solid #F4F0FC" : "none" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 20 }}>{tc.icon}</span>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ fontSize: 12, fontWeight: 700, padding: "2px 9px", borderRadius: 20, background: tc.bg, color: tc.color }}>{h.tone}</span>
                          </div>
                          <div style={{ fontSize: 12, color: "#9AA7C2", marginTop: 2 }}>Sent {h.sent}</div>
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        {h.opened
                          ? <span style={{ fontSize: 12, fontWeight: 600, color: "#15803D", background: "#DCFCE7", padding: "3px 10px", borderRadius: 20 }}>👁 Opened {h.openedAt}</span>
                          : <span style={{ fontSize: 12, fontWeight: 600, color: "#D97706", background: "#FEF9C3", padding: "3px 10px", borderRadius: 20 }}>📭 Not opened</span>
                        }
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right: Compose panel */}
        <div style={{ width: 400, flexShrink: 0 }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 22, boxShadow: "0 2px 12px rgba(91,42,158,0.08)", border: "1px solid #F0EAF8", position: "sticky", top: 20 }}>

            {/* Invoice quick info */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, paddingBottom: 16, borderBottom: "1px solid #F0EAF8" }}>
              <div>
                <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 800, fontSize: 16, color: "#1A1140" }}>{selected.id}</div>
                <div style={{ color: "#6B7894", fontSize: 13 }}>{selected.client} · {selected.email}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 800, fontSize: 18, color: "#1A1140" }}>₹{selected.amount.toLocaleString("en-IN")}</div>
                <div style={{ fontSize: 11.5, color: "#9AA7C2" }}>Due {selected.due}</div>
              </div>
            </div>

            {/* Best send time */}
            <div style={{ background: "#F7F0FF", border: "1px solid #EDE9FE", borderRadius: 10, padding: "10px 14px", marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 16 }}>⏰</span>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#5B2A9E" }}>Best Send Time</div>
                  <div style={{ fontSize: 12, color: "#6B7894" }}>
                    <strong>{selected.avgOpenTime}</strong> on <strong>{selected.avgOpenDay}s</strong> — when {selected.client.split(" ")[0]} usually opens emails
                  </div>
                </div>
              </div>
            </div>

            {/* Tone selector */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#9AA7C2", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 }}>
                Choose Tone
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {Object.entries(TONE_CONFIG).map(([key, tc]) => {
                  const isActive = tone === key;
                  const isSuggested = key === suggestedTone;
                  return (
                    <div
                      key={key}
                      onClick={() => setTone(key)}
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "11px 14px", borderRadius: 10, cursor: "pointer",
                        border: `1.5px solid ${isActive ? tc.border : "#F0EAF8"}`,
                        background: isActive ? tc.bg : "#FAFAFA",
                        transition: "all 0.15s",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 20 }}>{tc.icon}</span>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 13.5, color: isActive ? tc.color : "#1A1140" }}>{tc.label}</span>
                            {isSuggested && (
                              <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 10, background: "#EDE9FE", color: "#6D28D9" }}>AI Pick</span>
                            )}
                          </div>
                          <div style={{ fontSize: 12, color: "#9AA7C2" }}>{tc.desc}</div>
                        </div>
                      </div>
                      <div style={{
                        width: 18, height: 18, borderRadius: "50%",
                        border: `2px solid ${isActive ? tc.color : "#E2E8F4"}`,
                        background: isActive ? tc.color : "transparent",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        flexShrink: 0,
                      }}>
                        {isActive && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff" }} />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Message preview */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#9AA7C2", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 }}>
                Message Preview
              </div>
              <div style={{
                background: "#F7F9FC", border: "1px solid #E2E8F4", borderRadius: 10,
                padding: "14px 16px", fontSize: 13, color: "#2A3554", lineHeight: 1.7,
                whiteSpace: "pre-wrap", fontFamily: "'Inter',sans-serif",
                maxHeight: 220, overflowY: "auto",
              }}>
                {message}
              </div>
            </div>

            {/* Send button */}
            <button
              onClick={() => setShowConfirm(true)}
              style={{
                width: "100%", padding: "13px", borderRadius: 10, border: "none", cursor: "pointer",
                background: "linear-gradient(120deg,#FF6B81,#FF9472)",
                color: "#fff", fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 15,
                boxShadow: "0 4px 14px rgba(255,107,129,0.3)", transition: "filter 0.15s",
              }}
            >
              ✉️ Send {tone} Reminder
            </button>

            <div style={{ textAlign: "center", marginTop: 10, fontSize: 12, color: "#9AA7C2" }}>
              Will be sent at {selected.avgOpenTime} · {selected.remindersSent} reminder{selected.remindersSent !== 1 ? "s" : ""} sent so far
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}