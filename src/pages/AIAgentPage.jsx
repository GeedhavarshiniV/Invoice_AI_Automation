import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { api } from "../api/client";

const STATUS_COLOR = {
  Approved:  { bg: "#DCFCE7", color: "#15803D" },
  Sent:      { bg: "#FEF9C3", color: "#A16207" },
  Resolved:  { bg: "#E0F2FE", color: "#0369A1" },
  Escalated: { bg: "#FEE2E2", color: "#B91C1C" },
  Unhandled: { bg: "#EDE9FE", color: "#6D28D9" },
};

const QUICK_ACTIONS = [
  "Show all overdue invoices",
  "Send reminders to pending clients",
  "Review disputed invoices",
  "Generate payment summary",
];

function fmtDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

function initials(name) {
  if (!name) return "🤖";
  const parts = name.trim().split(" ");
  return parts.length > 1 ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() : name.slice(0, 2).toUpperCase();
}

export default function AIAgentPage() {
  const [messages, setMessages] = useState([
    { role: "agent", text: "Hello! I'm your Invoice Resolution Agent. Ask me about overdue invoices, disputes, reminders, extension approvals, or a payment summary.", time: "Now" },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [activeTab, setActiveTab] = useState("chat");
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({ handled_today: 0, auto_resolved: 0, escalated: 0, total_logged: 0 });
  const [loadingLogs, setLoadingLogs] = useState(false);
  const chatWindowRef = useRef(null);

  useEffect(() => {
    const el = chatWindowRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  useEffect(() => {
    refreshStats();
  }, []);

  useEffect(() => {
    if (activeTab === "logs") {
      loadLogs();
    }
  }, [activeTab]);

  async function refreshStats() {
    try {
      const s = await api.getAgentStats();
      setStats(s);
    } catch (err) {
      console.error("Failed to load agent stats:", err);
    }
  }

  async function loadLogs() {
    setLoadingLogs(true);
    try {
      const data = await api.getAgentLogs();
      setLogs(data || []);
    } catch (err) {
      console.error("Failed to load agent logs:", err);
    } finally {
      setLoadingLogs(false);
    }
  }

  const sendMessage = async (text) => {
    const userMsg = { role: "user", text, time: "Now" };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setTyping(true);

    try {
      const result = await api.sendAgentMessage(text);
      setMessages(prev => [...prev, { role: "agent", text: result.reply, time: "Now" }]);
      refreshStats();
    } catch (err) {
      setMessages(prev => [...prev, { role: "agent", text: "Something went wrong reaching the agent: " + (err.message || "unknown error"), time: "Now" }]);
    } finally {
      setTyping(false);
    }
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
        .send-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        .quick-chip {
          padding: 7px 14px; border-radius: 20px; border: 1.5px solid #E2E8F4;
          background: #fff; color: #5B2A9E; font-family: 'Inter', sans-serif;
          font-size: 12.5px; font-weight: 500; cursor: pointer;
          transition: all 0.15s; white-space: nowrap;
        }
        .quick-chip:hover { background: #F3EEFF; border-color: #C4B5FD; }

        .log-card { transition: transform 0.15s, box-shadow 0.15s; }
        .log-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(91,42,158,0.1); }

        ::-webkit-scrollbar { width:5px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:#D0BDF4; border-radius:6px; }
      `}</style>

      <div style={styles.topbar}>
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <h1 style={styles.pageTitle}>AI Resolution Agent</h1>
            <motion.span
              style={{ background:"#DCFCE7", color:"#15803D", fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:20, letterSpacing:"0.5px", display:"inline-block" }}
              animate={{ scale: [1, 1.12, 1] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
            >
              ● LIVE
            </motion.span>
          </div>
          <p style={styles.pageSubtitle}>Rule-based invoice assistant · Handles extensions, disputes & reminders using real data</p>
        </div>
        <div style={{ display:"flex", gap:8, background:"#F4F7FC", padding:"5px", borderRadius:12 }}>
          {["chat","logs"].map(tab => (
            <button key={tab} className={`tab-btn${activeTab===tab?" active":""}`} onClick={()=>setActiveTab(tab)}>
              {tab==="chat"?"💬 Chat":"📋 Logs"}
            </button>
          ))}
        </div>
      </div>

      <div style={styles.statsRow}>
        {[
          { label:"Handled Today", value:stats.handled_today, icon:"🤖", color:"#5B2A9E", bg:"#F3EEFF" },
          { label:"Auto-Resolved", value:stats.auto_resolved, icon:"✅", color:"#16A34A", bg:"#DCFCE7" },
          { label:"Escalated", value:stats.escalated, icon:"🚨", color:"#DC2626", bg:"#FEE2E2" },
          { label:"Total Logged", value:stats.total_logged, icon:"📊", color:"#D97706", bg:"#FEF9C3" },
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

      {activeTab === "chat" && (
        <div style={styles.chatLayout}>
          <div style={styles.chatMain}>
            <div style={styles.chatWindow} ref={chatWindowRef}>
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
                  <motion.div
                    style={{ width:34, height:34, borderRadius:"50%", background:"linear-gradient(135deg,#5B2A9E,#FF6B81)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16 }}
                    animate={{ scale: [1, 1.15, 1], boxShadow: ["0 0 0 0 rgba(91,42,158,0.4)", "0 0 0 8px rgba(91,42,158,0)", "0 0 0 0 rgba(91,42,158,0)"] }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                  >
                    🤖
                  </motion.div>
                  <div style={{ background:"#fff", border:"1px solid #F0EAF8", padding:"14px 18px", borderRadius:"16px 16px 16px 4px", display:"flex", gap:5, alignItems:"center", boxShadow:"0 2px 12px rgba(91,42,158,0.08)" }}>
                    {[0,1,2].map(j => (
                      <div key={j} style={{ width:7, height:7, borderRadius:"50%", background:"#C4B5FD", animation:`typingBounce 1.2s ease-in-out ${j*0.2}s infinite` }} />
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div style={{ padding:"12px 20px 14px", borderTop:"1px solid #F0EAF8", display:"flex", gap:8, flexWrap:"wrap" }}>
              {QUICK_ACTIONS.map((q,i) => (
                <button key={i} className="quick-chip" onClick={()=>sendMessage(q)}>{q}</button>
              ))}
            </div>

            <div style={{ padding:"0 20px 20px", display:"flex", gap:10 }}>
              <input className="chat-input" placeholder="Ask about overdue invoices, disputes, reminders, extensions, or a summary..." value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleSend()} disabled={typing} />
              <button className="send-btn" onClick={handleSend} disabled={typing}>Send ↑</button>
            </div>
          </div>

          <div style={styles.chatSidebar}>
            <h3 style={styles.sidebarTitle}>Agent Capabilities</h3>
            {[
              { icon:"⏳", label:"Extension Requests", desc:"Approves based on real payment history & risk score" },
              { icon:"💬", label:"Dispute Review", desc:"Surfaces real disputed invoices for review" },
              { icon:"📨", label:"Smart Reminders", desc:"Sends real reminders, logged to the database" },
              { icon:"📊", label:"Payment Analysis", desc:"Gives real summaries from your live invoice data" },
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

      {activeTab === "logs" && (
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          {loadingLogs && (
            <div style={{ textAlign: "center", padding: "48px 0", color: "#9AA7C2" }}>
              <p style={{ fontSize: 14 }}>Loading agent activity...</p>
            </div>
          )}
          {!loadingLogs && logs.length === 0 && (
            <div style={{ textAlign: "center", padding: "48px 0", color: "#9AA7C2" }}>
              <p style={{ fontSize: 32, margin: "0 0 8px" }}>🤖</p>
              <p style={{ fontSize: 15, fontWeight: 600, color: "#4A5578", margin: "0 0 4px" }}>No agent activity yet</p>
              <p style={{ fontSize: 13, margin: 0 }}>Chat with the agent to see logs appear here.</p>
            </div>
          )}
          {logs.map((log,i) => (
            <div key={log.id} className="log-card" style={{ background:"#fff", borderRadius:14, padding:"20px 24px", border:"1px solid #F0EAF8", boxShadow:"0 2px 12px rgba(91,42,158,0.06)", animation:`fadeUp 0.4s ease ${i*0.04}s both` }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
                <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                  <div style={{ width:40, height:40, borderRadius:"50%", background:`hsl(${(log.client||"agent").charCodeAt(0)*5%360},55%,68%)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:700, color:"#fff" }}>{initials(log.client)}</div>
                  <div>
                    <p style={{ margin:0, fontWeight:700, fontSize:14, color:"#1A1140" }}>{log.client || "General query"}</p>
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:3 }}>
                      <span style={{ fontSize:12, color:"#9AA7C2" }}>{log.action_type}</span>
                      <span style={{ width:3, height:3, borderRadius:"50%", background:"#D0BDF4", display:"inline-block" }}/>
                      <span style={{ fontSize:12, color:"#9AA7C2" }}>{fmtDate(log.time)}</span>
                    </div>
                  </div>
                </div>
                <span style={{ padding:"4px 12px", borderRadius:20, fontSize:12, fontWeight:600, background:(STATUS_COLOR[log.status]||STATUS_COLOR.Unhandled).bg, color:(STATUS_COLOR[log.status]||STATUS_COLOR.Unhandled).color }}>{log.status}</span>
              </div>
              <p style={{ margin:"0 0 6px", fontSize:12.5, color:"#9AA7C2" }}>Asked: "{log.message}"</p>
              <p style={{ margin:0, fontSize:13.5, color:"#4A5578", lineHeight:1.6, background:"#F7F9FC", padding:"10px 14px", borderRadius:9, whiteSpace: "pre-wrap" }}>{log.response}</p>
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