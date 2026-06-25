import React, { useState } from "react";

const CLIENT_HISTORY = {
  "INV-1041": { client: "Arjun Sharma", avatar: "AS", email: "arjun@sharma.com", amount: 18500, due: "Jun 25, 2026", totalInvoices: 8, paidOnTime: 6, avgDelayDays: 3, disputes: 0, lastPaid: "May 12, 2026", riskScore: 72 },
  "INV-1040": { client: "Priya Nair", avatar: "PN", email: "priya@nair.com", amount: 42000, due: "Jun 20, 2026", totalInvoices: 5, paidOnTime: 2, avgDelayDays: 9, disputes: 1, lastPaid: "Apr 08, 2026", riskScore: 28 },
  "INV-1037": { client: "Vikram Menon", avatar: "VM", email: "vikram@menon.com", amount: 14800, due: "Jun 12, 2026", totalInvoices: 4, paidOnTime: 2, avgDelayDays: 6, disputes: 1, lastPaid: "Mar 22, 2026", riskScore: 40 },
  "INV-1035": { client: "Rahul Das", avatar: "RD", email: "rahul@das.com", amount: 8900, due: "Jun 08, 2026", totalInvoices: 3, paidOnTime: 1, avgDelayDays: 12, disputes: 0, lastPaid: "Feb 14, 2026", riskScore: 32 },
};

const INVOICES = [
  { id: "INV-1041", status: "Pending" },
  { id: "INV-1040", status: "Overdue" },
  { id: "INV-1037", status: "Disputed" },
  { id: "INV-1035", status: "Pending" },
];

function getRiskLevel(score) {
  if (score >= 70) return { label: "Low Risk", color: "#16A34A", bg: "#DCFCE7", icon: "🟢" };
  if (score >= 45) return { label: "Medium Risk", color: "#D97706", bg: "#FEF9C3", icon: "🟡" };
  return { label: "High Risk", color: "#DC2626", bg: "#FEE2E2", icon: "🔴" };
}

function getSuggestedDays(score, avgDelay) {
  if (score >= 70) return { days: 7, reason: "Strong payment history — 7 days is safe." };
  if (score >= 45) return { days: 5, reason: "Moderate history — limit to 5 days to reduce exposure." };
  return { days: 3, reason: "High risk client — maximum 3 days recommended." };
}

function getAIMessage(clientName, days, riskLevel, amount) {
  if (riskLevel === "Low Risk") {
    return `Hi ${clientName},\n\nThank you for reaching out. We completely understand that things come up sometimes!\n\nWe're happy to extend your payment deadline by ${days} days. Your new due date is noted and updated in our system.\n\nPlease ensure the payment of ₹${amount.toLocaleString()} is settled by the new date. Feel free to reach out if you need anything further.\n\nWarm regards,\nLedgerly Team`;
  }
  if (riskLevel === "Medium Risk") {
    return `Hi ${clientName},\n\nThank you for getting in touch regarding invoice payment.\n\nWe can offer a ${days}-day extension for your payment of ₹${amount.toLocaleString()}. Please note this is a one-time accommodation and we expect payment by the revised due date.\n\nKindly confirm receipt of this message.\n\nRegards,\nLedgerly Team`;
  }
  return `Hi ${clientName},\n\nWe've received your extension request for ₹${amount.toLocaleString()}.\n\nGiven your current account standing, we can offer a limited ${days}-day extension. Failure to pay by the revised date will result in escalation to our collections process.\n\nPlease treat this as urgent.\n\nLedgerly Collections Team`;
}

export default function SmartExtensionPage() {
  const [selectedInvoice, setSelectedInvoice] = useState("");
  const [step, setStep] = useState(1); // 1=select, 2=analyze, 3=negotiate, 4=done
  const [analyzing, setAnalyzing] = useState(false);
  const [customDays, setCustomDays] = useState(null);
  const [approved, setApproved] = useState(false);
  const [extensions, setExtensions] = useState([
    { id: "INV-1038", client: "Meena Iyer", avatar: "MI", originalDue: "Jun 15, 2026", newDue: "Jun 22, 2026", days: 7, risk: "Low Risk", status: "Approved", time: "2 days ago" },
    { id: "INV-1033", client: "Deepak Nair", avatar: "DN", originalDue: "Jun 02, 2026", newDue: "Jun 05, 2026", days: 3, risk: "High Risk", status: "Approved", time: "5 days ago" },
  ]);

  const client = CLIENT_HISTORY[selectedInvoice];
  const risk = client ? getRiskLevel(client.riskScore) : null;
  const suggestion = client ? getSuggestedDays(client.riskScore, client.avgDelayDays) : null;
  const days = customDays ?? suggestion?.days;

  const addDaysToDate = (dateStr, d) => {
    const date = new Date(dateStr);
    date.setDate(date.getDate() + d);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const handleAnalyze = () => {
    setAnalyzing(true);
    setTimeout(() => { setAnalyzing(false); setStep(3); }, 1800);
  };

  const handleApprove = () => {
    setApproved(true);
    setStep(4);
    if (client) {
      setExtensions(prev => [{
        id: selectedInvoice, client: client.client, avatar: client.avatar,
        originalDue: client.due, newDue: addDaysToDate(client.due, days),
        days, risk: risk.label, status: "Approved", time: "Just now"
      }, ...prev]);
    }
  };

  const handleReset = () => {
    setStep(1); setSelectedInvoice(""); setCustomDays(null); setApproved(false);
  };

  return (
    <div style={styles.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&display=swap');
        * { box-sizing: border-box; }

        @keyframes fadeUp { from{opacity:0;transform:translateY(10px);} to{opacity:1;transform:translateY(0);} }
        @keyframes spin { to{transform:rotate(360deg);} }
        @keyframes pulse { 0%,100%{transform:scale(1);opacity:1;} 50%{transform:scale(1.05);opacity:0.8;} }
        @keyframes checkPop { 0%{transform:scale(0);opacity:0;} 70%{transform:scale(1.2);} 100%{transform:scale(1);opacity:1;} }
        @keyframes scanLine { 0%{top:0%;} 100%{top:100%;} }
        @keyframes glow { 0%,100%{box-shadow:0 0 0 0 rgba(91,42,158,0.3);} 50%{box-shadow:0 0 0 8px rgba(91,42,158,0);} }

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

        .step-dot { width: 10px; height: 10px; border-radius: 50%; transition: all 0.3s; }
        .step-dot.active { background: #5B2A9E; transform: scale(1.3); }
        .step-dot.done { background: #16A34A; }
        .step-dot.inactive { background: #E2E8F4; }

        .history-row { transition: background 0.15s; }
        .history-row:hover { background: #F7F0FF; }

        .score-ring { transition: stroke-dashoffset 1s ease; }

        ::-webkit-scrollbar { width:5px; }
        ::-webkit-scrollbar-thumb { background:#D0BDF4; border-radius:6px; }
      `}</style>

      {/* TOPBAR */}
      <div style={styles.topbar}>
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <h1 style={styles.pageTitle}>🗓 Smart Extension Negotiator</h1>
          </div>
          <p style={styles.pageSubtitle}>AI-powered deadline extensions with risk analysis & auto-generated client messages</p>
        </div>
      </div>

      {/* STEP INDICATOR */}
      <div style={{ display:"flex", alignItems:"center", gap:0, marginBottom:28 }}>
        {["Select Invoice","AI Analysis","Negotiate","Done"].map((s,i) => (
          <React.Fragment key={i}>
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:6 }}>
              <div style={{ width:32, height:32, borderRadius:"50%", background: step>i+1?"#16A34A": step===i+1?"#5B2A9E":"#F0EAF8", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:700, color: step>=i+1?"#fff":"#9AA7C2", transition:"all 0.3s" }}>
                {step>i+1 ? "✓" : i+1}
              </div>
              <span style={{ fontSize:11.5, fontWeight:600, color: step===i+1?"#5B2A9E": step>i+1?"#16A34A":"#9AA7C2" }}>{s}</span>
            </div>
            {i<3 && <div style={{ flex:1, height:2, background: step>i+1?"#16A34A":"#F0EAF8", margin:"0 8px 18px", transition:"background 0.4s" }} />}
          </React.Fragment>
        ))}
      </div>

      <div style={styles.layout}>
        {/* MAIN PANEL */}
        <div style={{ flex:1.4 }}>

          {/* STEP 1 — SELECT INVOICE */}
          {step === 1 && (
            <div style={styles.card}>
              <h2 style={styles.cardTitle}>Select Invoice for Extension</h2>
              <p style={{ fontSize:13.5, color:"#9AA7C2", margin:"4px 0 20px" }}>Choose which invoice needs a deadline extension</p>
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {INVOICES.map(inv => {
                  const c = CLIENT_HISTORY[inv.id];
                  const r = getRiskLevel(c.riskScore);
                  return (
                    <div key={inv.id} className={`inv-select-card${selectedInvoice===inv.id?" selected":""}`} onClick={()=>setSelectedInvoice(inv.id)}>
                      <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                        <div style={{ width:40, height:40, borderRadius:"50%", background:`hsl(${c.client.charCodeAt(0)*5%360},55%,68%)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:700, color:"#fff" }}>{c.avatar}</div>
                        <div>
                          <p style={{ margin:0, fontWeight:700, fontSize:14, color:"#1A1140" }}>{c.client}</p>
                          <p style={{ margin:0, fontSize:12.5, color:"#9AA7C2" }}>{inv.id} · ₹{c.amount.toLocaleString()} · Due {c.due}</p>
                        </div>
                      </div>
                      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                        <span style={{ padding:"4px 10px", borderRadius:20, fontSize:12, fontWeight:600, background:r.bg, color:r.color }}>{r.icon} {r.label}</span>
                        <div style={{ width:20, height:20, borderRadius:"50%", border:`2px solid ${selectedInvoice===inv.id?"#5B2A9E":"#E2E8F4"}`, background:selectedInvoice===inv.id?"#5B2A9E":"transparent", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, color:"#fff" }}>
                          {selectedInvoice===inv.id && "✓"}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <button className="action-btn purple" style={{ width:"100%", marginTop:20 }} disabled={!selectedInvoice} onClick={()=>setStep(2)}>
                Analyze This Invoice →
              </button>
            </div>
          )}

          {/* STEP 2 — ANALYZING */}
          {step === 2 && (
            <div style={{ ...styles.card, textAlign:"center", padding:"48px 32px" }}>
              <div style={{ position:"relative", width:100, height:100, margin:"0 auto 24px" }}>
                <div style={{ position:"absolute", inset:0, borderRadius:"50%", border:"3px solid #F0EAF8" }} />
                <div style={{ position:"absolute", inset:0, borderRadius:"50%", border:"3px solid transparent", borderTopColor:"#5B2A9E", animation:"spin 1s linear infinite" }} />
                <div style={{ position:"absolute", inset:8, borderRadius:"50%", border:"2px solid transparent", borderTopColor:"#FF9472", animation:"spin 0.7s linear infinite reverse" }} />
                <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:28 }}>🤖</div>
              </div>
              <h2 style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:20, fontWeight:700, color:"#1A1140", margin:"0 0 10px" }}>AI Analyzing Client...</h2>
              {!analyzing ? (
                <>
                  <p style={{ fontSize:13.5, color:"#9AA7C2", margin:"0 0 28px" }}>Reviewing payment history, risk factors, and optimal extension window for {client?.client}</p>
                  <button className="action-btn purple" onClick={handleAnalyze}>Start Analysis →</button>
                </>
              ) : (
                <div style={{ display:"flex", flexDirection:"column", gap:10, maxWidth:300, margin:"0 auto" }}>
                  {["Fetching payment history...","Calculating risk score...","Determining safe extension window...","Generating client message..."].map((t,i)=>(
                    <div key={i} style={{ display:"flex", alignItems:"center", gap:10, background:"#F7F9FC", borderRadius:8, padding:"9px 14px", animation:`fadeUp 0.4s ease ${i*0.3}s both` }}>
                      <div style={{ width:14, height:14, borderRadius:"50%", border:"2px solid #5B2A9E", borderTopColor:"transparent", animation:"spin 0.8s linear infinite", flexShrink:0 }} />
                      <span style={{ fontSize:13, color:"#4A5578" }}>{t}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* STEP 3 — NEGOTIATE */}
          {step === 3 && client && (
            <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
              {/* RISK CARD */}
              <div style={{ ...styles.card, background:"linear-gradient(135deg,#1A1140,#3B1F73)", color:"#fff" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <div>
                    <p style={{ margin:"0 0 4px", fontSize:12, fontWeight:600, color:"rgba(255,255,255,0.6)", textTransform:"uppercase", letterSpacing:"0.5px" }}>AI Risk Assessment</p>
                    <h2 style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:22, fontWeight:700, color:"#fff", margin:"0 0 6px" }}>{client.client}</h2>
                    <span style={{ padding:"4px 12px", borderRadius:20, fontSize:12, fontWeight:700, background:risk.bg, color:risk.color }}>{risk.icon} {risk.label}</span>
                  </div>
                  <div style={{ position:"relative", width:90, height:90 }}>
                    <svg viewBox="0 0 36 36" style={{ width:"100%", height:"100%", transform:"rotate(-90deg)" }}>
                      <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="3" />
                      <circle className="score-ring" cx="18" cy="18" r="15.9" fill="none"
                        stroke={risk.color} strokeWidth="3" strokeLinecap="round"
                        strokeDasharray={`${client.riskScore} 100`} strokeDashoffset="0" />
                    </svg>
                    <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
                      <span style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:20, fontWeight:700, color:"#fff" }}>{client.riskScore}</span>
                      <span style={{ fontSize:10, color:"rgba(255,255,255,0.6)" }}>/ 100</span>
                    </div>
                  </div>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginTop:18 }}>
                  {[
                    { label:"Total Invoices", value:client.totalInvoices },
                    { label:"Paid On Time", value:`${client.paidOnTime}/${client.totalInvoices}` },
                    { label:"Avg Delay", value:`${client.avgDelayDays} days` },
                    { label:"Disputes", value:client.disputes },
                  ].map(s=>(
                    <div key={s.label} style={{ background:"rgba(255,255,255,0.08)", borderRadius:9, padding:"10px 12px" }}>
                      <p style={{ margin:"0 0 2px", fontSize:11, color:"rgba(255,255,255,0.5)", fontWeight:600 }}>{s.label}</p>
                      <p style={{ margin:0, fontSize:16, fontWeight:700, color:"#fff", fontFamily:"'Space Grotesk',sans-serif" }}>{s.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* EXTENSION PICKER */}
              <div style={styles.card}>
                <h3 style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:15, fontWeight:700, color:"#1A1140", margin:"0 0 6px" }}>Choose Extension Days</h3>
                <div style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 14px", background:"#F3EEFF", borderRadius:10, marginBottom:16, border:"1px solid #DDD6FE" }}>
                  <span style={{ fontSize:16 }}>🤖</span>
                  <p style={{ margin:0, fontSize:13, color:"#5B2A9E", fontWeight:500 }}><strong>AI Suggests: {suggestion.days} days</strong> — {suggestion.reason}</p>
                </div>
                <div style={{ display:"flex", gap:10, marginBottom:16 }}>
                  {[3, 5, 7, 10, 14].map(d=>(
                    <button key={d} className={`day-btn${days===d?" selected":""}`} onClick={()=>setCustomDays(d)}>{d}</button>
                  ))}
                </div>
                <div style={{ display:"flex", justifyContent:"space-between", padding:"12px 16px", background:"#F7F9FC", borderRadius:10 }}>
                  <div>
                    <p style={{ margin:"0 0 2px", fontSize:12, color:"#9AA7C2", fontWeight:600 }}>ORIGINAL DUE DATE</p>
                    <p style={{ margin:0, fontSize:14, fontWeight:700, color:"#1A1140" }}>{client.due}</p>
                  </div>
                  <div style={{ fontSize:22, color:"#C4B5FD", alignSelf:"center" }}>→</div>
                  <div style={{ textAlign:"right" }}>
                    <p style={{ margin:"0 0 2px", fontSize:12, color:"#9AA7C2", fontWeight:600 }}>NEW DUE DATE</p>
                    <p style={{ margin:0, fontSize:14, fontWeight:700, color:"#16A34A" }}>{addDaysToDate(client.due, days)}</p>
                  </div>
                </div>
              </div>

              {/* AUTO MESSAGE */}
              <div style={styles.card}>
                <h3 style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:15, fontWeight:700, color:"#1A1140", margin:"0 0 6px" }}>Auto-Generated Client Message</h3>
                <p style={{ fontSize:12.5, color:"#9AA7C2", margin:"0 0 12px" }}>Tone adapted based on risk level — {risk.label}</p>
                <textarea readOnly value={getAIMessage(client.client, days, risk.label, client.amount)}
                  style={{ width:"100%", padding:"14px", borderRadius:10, border:"1.5px solid #E2E8F4", fontSize:13, fontFamily:"'Inter',sans-serif", lineHeight:1.7, color:"#2A3554", background:"#F7F9FC", resize:"none", outline:"none", height:180 }} />
                <div style={{ display:"flex", gap:10, marginTop:14 }}>
                  <button className="action-btn ghost" style={{ flex:1 }} onClick={handleReset}>← Back</button>
                  <button className="action-btn primary" style={{ flex:2 }} onClick={handleApprove}>
                    ✅ Approve & Send to Client
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4 — DONE */}
          {step === 4 && (
            <div style={{ ...styles.card, textAlign:"center", padding:"52px 32px" }}>
              <div style={{ width:80, height:80, borderRadius:"50%", background:"linear-gradient(135deg,#16A34A,#4ADE80)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 20px", fontSize:36, animation:"checkPop 0.5s cubic-bezier(0.34,1.56,0.64,1) both" }}>✓</div>
              <h2 style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:22, fontWeight:700, color:"#1A1140", margin:"0 0 8px" }}>Extension Approved!</h2>
              <p style={{ fontSize:14, color:"#6B7894", margin:"0 0 6px" }}>
                <strong>{client?.client}</strong>'s deadline extended by <strong>{days} days</strong>
              </p>
              <p style={{ fontSize:13, color:"#16A34A", fontWeight:600, margin:"0 0 28px" }}>New due date: {client && addDaysToDate(client.due, days)} · Email sent ✉️</p>
              <div style={{ display:"flex", gap:10, justifyContent:"center" }}>
                <button className="action-btn ghost" onClick={handleReset}>Process Another</button>
                <button className="action-btn purple">View in Invoices →</button>
              </div>
            </div>
          )}
        </div>

        {/* SIDEBAR — HISTORY */}
        <div style={{ width:300, display:"flex", flexDirection:"column", gap:16 }}>
          <div style={styles.card}>
            <h3 style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:14, fontWeight:700, color:"#1A1140", margin:"0 0 14px" }}>Extension History</h3>
            <div style={{ display:"flex", flexDirection:"column", gap:0 }}>
              {extensions.map((e,i)=>(
                <div key={i} className="history-row" style={{ padding:"12px 0", borderBottom: i<extensions.length-1?"1px solid #F4F0FC":"none" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:6 }}>
                    <div style={{ width:32, height:32, borderRadius:"50%", background:`hsl(${e.client.charCodeAt(0)*5%360},55%,68%)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, color:"#fff", flexShrink:0 }}>{e.avatar}</div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <p style={{ margin:0, fontWeight:600, fontSize:13, color:"#1A1140", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{e.client}</p>
                      <p style={{ margin:0, fontSize:11.5, color:"#9AA7C2" }}>{e.id} · +{e.days} days</p>
                    </div>
                    <span style={{ fontSize:11, fontWeight:600, color:"#16A34A", background:"#DCFCE7", padding:"2px 8px", borderRadius:10, flexShrink:0 }}>{e.status}</span>
                  </div>
                  <div style={{ display:"flex", justifyContent:"space-between", fontSize:11.5, color:"#9AA7C2", paddingLeft:42 }}>
                    <span>{e.originalDue} → {e.newDue}</span>
                    <span>{e.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ ...styles.card, background:"linear-gradient(135deg,#1A1140,#3B1F73)" }}>
            <h3 style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:13, fontWeight:700, color:"#fff", margin:"0 0 14px" }}>📊 Extension Stats</h3>
            {[
              { label:"Total Extensions", value: extensions.length + (step===4?0:0), color:"#C4B5FD" },
              { label:"Auto-Approved", value: extensions.filter(e=>e.risk==="Low Risk").length, color:"#4ADE80" },
              { label:"Avg Days Given", value:`${Math.round(extensions.reduce((s,e)=>s+e.days,0)/Math.max(extensions.length,1))}d`, color:"#FCD34D" },
              { label:"On-time after ext.", value:"78%", color:"#93C5FD" },
            ].map((s,i)=>(
              <div key={i} style={{ display:"flex", justifyContent:"space-between", padding:"9px 0", borderBottom: i<3?"1px solid rgba(255,255,255,0.08)":"none" }}>
                <span style={{ fontSize:12.5, color:"rgba(255,255,255,0.65)" }}>{s.label}</span>
                <span style={{ fontSize:13, fontWeight:700, color:s.color, fontFamily:"'Space Grotesk',sans-serif" }}>{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { fontFamily:"'Inter',sans-serif", padding:"28px 32px", minHeight:"100vh", background:"#F4F7FC" },
  topbar: { display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:22 },
  pageTitle: { fontFamily:"'Space Grotesk',sans-serif", fontSize:24, fontWeight:700, color:"#1A1140", margin:0, letterSpacing:"-0.4px" },
  pageSubtitle: { fontSize:13.5, color:"#6B7894", margin:"4px 0 0" },
  layout: { display:"flex", gap:20, alignItems:"flex-start" },
  card: { background:"#fff", borderRadius:14, padding:"22px 24px", boxShadow:"0 2px 12px rgba(91,42,158,0.07)", border:"1px solid #F0EAF8" },
  cardTitle: { fontFamily:"'Space Grotesk',sans-serif", fontSize:17, fontWeight:700, color:"#1A1140", margin:"0 0 4px" },
};