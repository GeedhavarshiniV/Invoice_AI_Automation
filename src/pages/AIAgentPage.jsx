import React, { useState, useEffect, useRef } from "react";

const AGENT_LOGS = [
  { id: 1, client: "Arjun Sharma", avatar: "AS", type: "Extension Request", status: "Approved", time: "2 mins ago", message: "Client requested 7-day extension for INV-1041 (₹18,500). Payment history: 6/8 on time. Auto-approved based on policy.", action: "Extension granted till Jul 2, 2026", color: "#16A34A" },
  { id: 2, client: "Priya Nair", avatar: "PN", type: "Overdue Reminder", status: "Sent", time: "1 hour ago", message: "INV-1040 overdue by 2 days (₹42,000). Sent personalized reminder via email. Tone: firm but polite.", action: "Follow-up scheduled in 48 hours", color: "#D97706" },
  { id: 3, client: "Vikram Menon", avatar: "VM", type: "Dispute Resolution", status: "Resolved", time: "3 hours ago", message: "Client disputed duplicate charge on INV-1037. Agent cross-checked line items. Duplicate confirmed. Partial refund of ₹2,800 approved.", action: "Refund processed, admin notified", color: "#0EA5E9" },
  { id: 4, client: "Deepak Nair", avatar: "DN", type: "Overdue Reminder", status: "Escalated", time: "5 hours ago", message: "INV-1033 overdue by 4 days (₹17,300). Two reminders sent. No response. Escalating to admin for manual follow-up.", action: "Admin notified via Slack", color: "#DC2626" },
  { id: 5, client: "Suresh Kumar", avatar: "SK", type: "Dispute Resolution", status: "Pending", time: "Yesterday", message: "Client disputed service charges on INV-1031 (₹12,400). Agent is analyzing invoice line items against contract terms.", action: "Review in progress...", color: "#6D28D9" },
  { id: 6, client: "Rahul Das", avatar: "RD", type: "Payment Confirmation", status: "Confirmed", time: "Yesterday", message: "Payment received for INV-1035 (₹8,900). Client notified with receipt. Invoice marked as paid.", action: "Receipt sent to rahul@das.com", color: "#16A34A" },
];

const CHAT_HISTORY = [
  { role: "agent", text: "Hello! I'm your AI Invoice Resolution Agent. I can help you review overdue invoices, handle client disputes, send reminders, or approve extension requests. What would you like to do?", time: "Now" },
];

const QUICK_ACTIONS = [
  "Show all overdue invoices",
  "Send reminders to pending clients",
  "Review disputed invoices",
  "Approve extension for Arjun Sharma",
  "Generate payment summary",
];

const AGENT_RESPONSES = {
  "show all overdue invoices": "📋 Found **2 overdue invoices**:\n\n• **INV-1040** — Priya Nair — ₹42,000 — 2 days overdue\n• **INV-1033** — Deepak Nair — ₹17,300 — 4 days overdue\n\nWould you like me to send reminders to both clients?",
  "send reminders to pending clients": "✅ Sending personalized reminders to **3 pending clients**:\n\n• Arjun Sharma (INV-1041) — Gentle nudge\n• Rahul Das (INV-1035) — Standard reminder\n• Vikram Menon (INV-1037) — Firm reminder\n\nAll reminders sent successfully!",
  "review disputed invoices": "🔍 **2 disputed invoices** under review:\n\n• **INV-1037** — Vikram Menon — ₹14,800 — Duplicate charge suspected ✅ Resolved\n• **INV-1031** — Suresh Kumar — ₹12,400 — Service charge dispute ⏳ Pending\n\nShall I escalate INV-1031 to admin?",
  "approve extension for arjun sharma": "✅ **Extension approved** for Arjun Sharma!\n\n• Invoice: INV-1041\n• Amount: ₹18,500\n• New due date: **July 2, 2026** (+7 days)\n• Reason: Good payment history (6/8 on time)\n\nClient has been notified via email.",
  "generate payment summary": "📊 **Payment Summary — June 2026**\n\n• Total billed: ₹3,13,400\n• Collected: ₹2,48,500 (79.3%)\n• Outstanding: ₹64,900\n• Overdue: ₹59,300\n\nCollection rate is up 4.2% from last month! 📈",
};

const STATUS_COLOR = {
  Approved:  { bg: "#DCFCE7", color: "#15803D" },
  Sent:      { bg: "#FEF9C3", color: "#A16207" },
  Resolved:  { bg: "#E0F2FE", color: "#0369A1" },
  Escalated: { bg: "#FEE2E2", color: "#B91C1C" },
  Pending:   { bg: "#EDE9FE", color: "#6D28D9" },
  Confirmed: { bg: "#DCFCE7", color: "#15803D" },
};

export default function AIAgentPage() {
  const [messages, setMessages] = useState(CHAT_HISTORY);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [activeTab, setActiveTab] = useState("chat"); // chat | logs | settings
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  const sendMessage = (text) => {
    const userMsg = { role: "user", text, time: "Now" };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setTyping(true);

    setTimeout(() => {
      const key = text.toLowerCase().trim();
      const found = Object.keys(AGENT_RESPONSES).find(k => key.includes(k) || k.includes(key));
      const reply = found ? AGENT_RESPONSES[found] : `I understand you're asking about "${text}". Let me check the invoice data and get back to you with the relevant information. Is there anything specific you'd like me to focus on?`;
      setTyping(false);
      setMessages(prev => [...prev, { role: "agent", text: reply, time: "Now" }]);
    }, 1400);
  };

  const handleSend = () => { if (input.trim()) sendMessage(input.trim()); };

  const formatText = (text) => {
    return text.split("\n").map((line, i) => (
      <p key={i} style={{ margin: "2px 0", lineHeight: 1.6 }}>
        {line.split(/\*\*(.*?)\*\*/).map((part, j) =>
          j % 2 === 1 ? <strong key={j}>{part}</strong> : part
        )}
      </p>
    ));
  };

  return (
    <div style={styles.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&display=swap');
        * { box-sizing: border-box; }

        @keyframes fadeUp { from{opacity:0;transform:translateY(10px);} to{opacity:1;transform:translateY(0);} }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1);} 50%{opacity:0.5;transform:scale(0.85);} }
        @keyframes typingBounce { 0%,60%,100%{transform:translateY(0);} 30%{transform:translateY(-6px);} }
        @keyframes slideIn { from{opacity:0;transform:translateX(-10px);} to{opacity:1;transform:translateX(0);} }
        @keyframes agentSlide { from{opacity:0;transform:translateX(10px);} to{opacity:1;transform:translateX(0);} }

        .tab-btn {
          padding: 9px 20px; border-radius: 9px; border: none; cursor: pointer;
          font-family: 'Inter', sans-serif; font-size: 13.5px; font-weight: 600;
          transition: all 0.15s; background: none; color: #9AA7C2;
        }
        .tab-btn.active { background: #fff; color: #5B2A9E; box-shadow: 0 2px 8px rgba(91,42,158,0.12); }

        .chat-input {
          flex: 1; padding: 13px 16px; border-radius: 12px;
          border: 1.5px solid #E2E8F4; background: #F7F9FC;
          font-family: 'Inter', sans-serif; font-size: 14px; color: #2A3554; outline: none;
          transition: border-color 0.18s, box-shadow 0.18s;
        }
        .chat-input:focus { border-color: #A78BFA; box-shadow: 0 0 0 4px rgba(167,139,250,0.12); background: #fff; }
        .chat-input::placeholder { color: #9AA7C2; }

        .send-btn {
          padding: 13px 22px; border-radius: 12px; border: none;
          background: linear-gradient(120deg,#FF6B81,#FF9472); color: #fff;
          font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 700;
          cursor: pointer; transition: transform 0.12s, filter 0.12s;
          box-shadow: 0 6px 16px rgba(255,107,129,0.3);
        }
        .send-btn:hover { transform: translateY(-1px); filter: brightness(1.07); }
        .send-btn:active { transform: scale(0.98); }

        .quick-chip {
          padding: 7px 14px; border-radius: 20px; border: 1.5px solid #E2E8F4;
          background: #fff; color: #5B2A9E; font-family: 'Inter', sans-serif;
          font-size: 12.5px; font-weight: 500; cursor: pointer;
          transition: all 0.15s; white-space: nowrap;
        }
        .quick-chip:hover { background: #F3EEFF; border-color: #C4B5FD; }

        .log-card { transition: transform 0.15s, box-shadow 0.15s; }
        .log-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(91,42,158,0.1); }

        .toggle-switch { position:relative; width:44px; height:24px; }
        .toggle-switch input { opacity:0; width:0; height:0; }
        .toggle-slider { position:absolute; cursor:pointer; inset:0; background:#E2E8F4; border-radius:24px; transition:0.3s; }
        .toggle-slider:before { position:absolute; content:""; height:18px; width:18px; left:3px; bottom:3px; background:#fff; border-radius:50%; transition:0.3s; box-shadow:0 1px 4px rgba(0,0,0,0.15); }
        input:checked + .toggle-slider { background:#5B2A9E; }
        input:checked + .toggle-slider:before { transform:translateX(20px); }

        ::-webkit-scrollbar { width:5px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:#D0BDF4; border-radius:6px; }
      `}</style>

      {/* TOPBAR */}
      <div style={styles.topbar}>
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <h1 style={styles.pageTitle}>AI Resolution Agent</h1>
            <span style={{ background:"#DCFCE7", color:"#15803D", fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:20, letterSpacing:"0.5px" }}>● LIVE</span>
          </div>
          <p style={styles.pageSubtitle}>Powered by CrewAI · Handles extensions, disputes & reminders autonomously</p>
        </div>
        <div style={{ display:"flex", gap:8, background:"#F4F7FC", padding:"5px", borderRadius:12 }}>
          {["chat","logs","settings"].map(tab => (
            <button key={tab} className={`tab-btn${activeTab===tab?" active":""}`} onClick={()=>setActiveTab(tab)}>
              {tab==="chat"?"💬 Chat":tab==="logs"?"📋 Logs":"⚙️ Config"}
            </button>
          ))}
        </div>
      </div>

      {/* STAT ROW */}
      <div style={styles.statsRow}>
        {[
          { label:"Handled Today", value:"12", icon:"🤖", color:"#5B2A9E", bg:"#F3EEFF" },
          { label:"Auto-Resolved", value:"9", icon:"✅", color:"#16A34A", bg:"#DCFCE7" },
          { label:"Escalated", value:"1", icon:"🚨", color:"#DC2626", bg:"#FEE2E2" },
          { label:"Avg Response", value:"1.2s", icon:"⚡", color:"#D97706", bg:"#FEF9C3" },
        ].map((s,i) => (
          <div key={i} style={{ ...styles.statCard, animationDelay:`${i*0.07}s` }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div>
                <p style={{ margin:"0 0 4px", fontSize:11.5, fontWeight:700, color:"#9AA7C2", textTransform:"uppercase", letterSpacing:"0.5px" }}>{s.label}</p>
                <p style={{ margin:0, fontFamily:"'Space Grotesk',sans-serif", fontSize:26, fontWeight:700, color:"#1A1140" }}>{s.value}</p>
              </div>
              <div style={{ width:44, height:44, borderRadius:12, background:s.bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>{s.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* CHAT TAB */}
      {activeTab === "chat" && (
        <div style={styles.chatLayout}>
          <div style={styles.chatMain}>
            <div style={styles.chatWindow}>
              {messages.map((msg, i) => (
                <div key={i} style={{ display:"flex", justifyContent: msg.role==="user"?"flex-end":"flex-start", marginBottom:16, animation: msg.role==="user"?"slideIn 0.3s ease":"agentSlide 0.3s ease" }}>
                  {msg.role === "agent" && (
                    <div style={{ width:34, height:34, borderRadius:"50%", background:"linear-gradient(135deg,#5B2A9E,#FF6B81)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, flexShrink:0, marginRight:10, marginTop:2 }}>🤖</div>
                  )}
                  <div style={{ maxWidth:"70%", background: msg.role==="user"?"linear-gradient(120deg,#FF6B81,#FF9472)":"#fff", color: msg.role==="user"?"#fff":"#2A3554", padding:"12px 16px", borderRadius: msg.role==="user"?"16px 16px 4px 16px":"16px 16px 16px 4px", boxShadow:"0 2px 12px rgba(91,42,158,0.1)", border: msg.role==="agent"?"1px solid #F0EAF8":"none", fontSize:13.5, lineHeight:1.6 }}>
                    {formatText(msg.text)}
                    <p style={{ margin:"6px 0 0", fontSize:11, opacity:0.6 }}>{msg.time}</p>
                  </div>
                  {msg.role === "user" && (
                    <div style={{ width:34, height:34, borderRadius:"50%", background:"linear-gradient(135deg,#1A1140,#5B2A9E)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:700, color:"#fff", flexShrink:0, marginLeft:10, marginTop:2 }}>You</div>
                  )}
                </div>
              ))}

              {typing && (
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
                  <div style={{ width:34, height:34, borderRadius:"50%", background:"linear-gradient(135deg,#5B2A9E,#FF6B81)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16 }}>🤖</div>
                  <div style={{ background:"#fff", border:"1px solid #F0EAF8", padding:"14px 18px", borderRadius:"16px 16px 16px 4px", display:"flex", gap:5, alignItems:"center", boxShadow:"0 2px 12px rgba(91,42,158,0.08)" }}>
                    {[0,1,2].map(j => (
                      <div key={j} style={{ width:7, height:7, borderRadius:"50%", background:"#C4B5FD", animation:`typingBounce 1.2s ease-in-out ${j*0.2}s infinite` }} />
                    ))}
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* QUICK ACTIONS */}
            <div style={{ padding:"12px 20px 14px", borderTop:"1px solid #F0EAF8", display:"flex", gap:8, flexWrap:"wrap" }}>
              {QUICK_ACTIONS.map((q,i) => (
                <button key={i} className="quick-chip" onClick={()=>sendMessage(q)}>{q}</button>
              ))}
            </div>

            {/* INPUT */}
            <div style={{ padding:"0 20px 20px", display:"flex", gap:10 }}>
              <input className="chat-input" placeholder="Ask the AI agent anything about your invoices..." value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleSend()} />
              <button className="send-btn" onClick={handleSend}>Send ↑</button>
            </div>
          </div>

          {/* SIDEBAR */}
          <div style={styles.chatSidebar}>
            <h3 style={styles.sidebarTitle}>Agent Capabilities</h3>
            {[
              { icon:"⏳", label:"Extension Requests", desc:"Auto-approves based on payment history & policy rules" },
              { icon:"💬", label:"Dispute Handling", desc:"Analyzes invoice line items and resolves or escalates" },
              { icon:"📨", label:"Smart Reminders", desc:"Sends personalized reminders with the right tone" },
              { icon:"🔔", label:"Admin Alerts", desc:"Notifies you instantly when escalation is needed" },
              { icon:"📊", label:"Payment Analysis", desc:"Gives summaries and risk insights on demand" },
            ].map((cap,i) => (
              <div key={i} style={{ padding:"12px", background:"#F7F9FC", borderRadius:10, marginBottom:8 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                  <span style={{ fontSize:16 }}>{cap.icon}</span>
                  <span style={{ fontSize:13, fontWeight:600, color:"#1A1140" }}>{cap.label}</span>
                </div>
                <p style={{ margin:0, fontSize:12, color:"#9AA7C2", lineHeight:1.5 }}>{cap.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* LOGS TAB */}
      {activeTab === "logs" && (
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          {AGENT_LOGS.map((log,i) => (
            <div key={log.id} className="log-card" style={{ background:"#fff", borderRadius:14, padding:"20px 24px", border:"1px solid #F0EAF8", boxShadow:"0 2px 12px rgba(91,42,158,0.06)", animation:`fadeUp 0.4s ease ${i*0.06}s both` }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
                <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                  <div style={{ width:40, height:40, borderRadius:"50%", background:`hsl(${log.client.charCodeAt(0)*5%360},55%,68%)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:700, color:"#fff" }}>{log.avatar}</div>
                  <div>
                    <p style={{ margin:0, fontWeight:700, fontSize:14, color:"#1A1140" }}>{log.client}</p>
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:3 }}>
                      <span style={{ fontSize:12, color:"#9AA7C2" }}>{log.type}</span>
                      <span style={{ width:3, height:3, borderRadius:"50%", background:"#D0BDF4", display:"inline-block" }}/>
                      <span style={{ fontSize:12, color:"#9AA7C2" }}>{log.time}</span>
                    </div>
                  </div>
                </div>
                <span style={{ padding:"4px 12px", borderRadius:20, fontSize:12, fontWeight:600, background:STATUS_COLOR[log.status].bg, color:STATUS_COLOR[log.status].color }}>{log.status}</span>
              </div>
              <p style={{ margin:"0 0 10px", fontSize:13.5, color:"#4A5578", lineHeight:1.6, background:"#F7F9FC", padding:"10px 14px", borderRadius:9 }}>{log.message}</p>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <div style={{ width:6, height:6, borderRadius:"50%", background:log.color }} />
                <span style={{ fontSize:12.5, color:log.color, fontWeight:600 }}>{log.action}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CONFIG TAB */}
      {activeTab === "settings" && (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
          {[
            { title:"Extension Requests", desc:"Auto-approve extensions based on client payment history", settings:[
              { label:"Auto-approve if on-time rate > 70%", enabled:true },
              { label:"Maximum extension days allowed", enabled:true, type:"number", value:"7" },
              { label:"Notify admin on every approval", enabled:false },
            ]},
            { title:"Overdue Reminders", desc:"Automated reminders for overdue and pending invoices", settings:[
              { label:"Send first reminder after 1 day overdue", enabled:true },
              { label:"Send follow-up every 48 hours", enabled:true },
              { label:"Escalate after 3 failed reminders", enabled:true },
            ]},
            { title:"Dispute Handling", desc:"AI analysis and resolution of client disputes", settings:[
              { label:"Auto-resolve duplicate charge disputes", enabled:true },
              { label:"Require admin approval for refunds > ₹5,000", enabled:true },
              { label:"Send dispute summary to admin", enabled:true },
            ]},
            { title:"Notifications", desc:"How the agent alerts you about important events", settings:[
              { label:"Slack notifications for escalations", enabled:true },
              { label:"Email summary every morning at 9AM", enabled:true },
              { label:"SMS alerts for overdue > ₹50,000", enabled:false },
            ]},
          ].map((section,i) => (
            <div key={i} style={{ background:"#fff", borderRadius:14, padding:"22px 24px", border:"1px solid #F0EAF8", boxShadow:"0 2px 12px rgba(91,42,158,0.06)" }}>
              <h3 style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:15, fontWeight:700, color:"#1A1140", margin:"0 0 4px" }}>{section.title}</h3>
              <p style={{ fontSize:12.5, color:"#9AA7C2", margin:"0 0 18px" }}>{section.desc}</p>
              {section.settings.map((s,j) => (
                <div key={j} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"11px 0", borderBottom: j<section.settings.length-1?"1px solid #F4F0FC":"none" }}>
                  <span style={{ fontSize:13.5, color:"#2A3554", fontWeight:500, flex:1, marginRight:12 }}>{s.label}</span>
                  {s.type === "number" ? (
                    <input type="number" defaultValue={s.value} style={{ width:60, padding:"5px 10px", borderRadius:7, border:"1.5px solid #E2E8F4", fontSize:13, textAlign:"center", outline:"none", fontFamily:"'Inter',sans-serif" }} />
                  ) : (
                    <label className="toggle-switch">
                      <input type="checkbox" defaultChecked={s.enabled} />
                      <span className="toggle-slider" />
                    </label>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  page: { fontFamily:"'Inter',sans-serif", padding:"28px 32px", minHeight:"100vh", background:"#F4F7FC" },
  topbar: { display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:24 },
  pageTitle: { fontFamily:"'Space Grotesk',sans-serif", fontSize:24, fontWeight:700, color:"#1A1140", margin:0, letterSpacing:"-0.4px" },
  pageSubtitle: { fontSize:13.5, color:"#6B7894", margin:"4px 0 0" },
  statsRow: { display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16, marginBottom:22 },
  statCard: { background:"#fff", borderRadius:14, padding:"18px 20px", boxShadow:"0 2px 12px rgba(91,42,158,0.07)", border:"1px solid #F0EAF8", animation:"fadeUp 0.4s ease both" },
  chatLayout: { display:"flex", gap:20 },
  chatMain: { flex:1, background:"#fff", borderRadius:14, border:"1px solid #F0EAF8", boxShadow:"0 2px 12px rgba(91,42,158,0.07)", display:"flex", flexDirection:"column", overflow:"hidden" },
  chatWindow: { flex:1, padding:"24px 20px", overflowY:"auto", minHeight:360, maxHeight:420 },
  chatSidebar: { width:260, display:"flex", flexDirection:"column", gap:0 },
  sidebarTitle: { fontFamily:"'Space Grotesk',sans-serif", fontSize:14, fontWeight:700, color:"#1A1140", margin:"0 0 12px" },
};