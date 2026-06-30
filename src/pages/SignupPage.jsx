import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import SEO from "../components/SEO";
import { api, saveToken } from "../api/client";

export default function SignupPage({ onLogin }) {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await api.register(name, email, password);

      // Case 1: backend auto-logs in and returns a token straight away
      const token = data && (data.access_token || data.token);
      if (token) {
        saveToken(token);
        const userName = data.user?.name || name;
        onLogin({ email: data.user?.email || email, name: userName });
        navigate("/dashboard");
        return;
      }

      // Case 2: backend just confirms account creation, no token yet
      setSuccess(true);
      setTimeout(() => navigate("/login"), 1800);
    } catch (err) {
      setError(err.message || "Could not create account. Try a different email.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <SEO
        title="Create Account"
        description="Create your Ledgerly account to manage invoices, track payments, and let the AI agent handle follow-ups and disputes."
        path="/signup"
        noIndex
      />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; }

        @keyframes panelIn { from { opacity:0; transform:translateX(24px);} to { opacity:1; transform:translateX(0);} }
        @keyframes cardIn { from { opacity:0; transform:translateY(16px);} to { opacity:1; transform:translateY(0);} }
        @keyframes spin { to{transform:rotate(360deg);} }
        @keyframes shake { 0%,100%{transform:translateX(0);} 20%,60%{transform:translateX(-8px);} 40%,80%{transform:translateX(8px);} }
        @keyframes shine { 0%{transform:translateX(-130%) rotate(20deg);} 100%{transform:translateX(230%) rotate(20deg);} }
        @keyframes floatSlow { 0%,100%{transform:translateY(0);} 50%{transform:translateY(-10px);} }
        @keyframes barGrow { from{transform:scaleY(0);} to{transform:scaleY(1);} }

        .left-panel { animation: panelIn 0.7s cubic-bezier(0.16,1,0.3,1) both; }
        .auth-card { animation: cardIn 0.6s cubic-bezier(0.16,1,0.3,1) 0.15s both; }
        .float-icon { animation:floatSlow 5s ease-in-out infinite; }
        .mini-bar { transform-origin:bottom; animation:barGrow 0.6s ease-out both; }
        .error-shake { animation:shake 0.4s ease; }

        .field-input {
          width:100%; padding:13px 16px;
          background:#F7F9FC; border:1.5px solid #E2E8F4; border-radius:10px;
          color:#0F1E3D; font-family:'Inter',sans-serif; font-size:15px; outline:none;
          transition:border-color 0.18s, box-shadow 0.18s, background 0.18s;
        }
        .field-input::placeholder { color:#9AA7C2; }
        .field-input:focus { border-color:#FF9472; background:#fff; box-shadow:0 0 0 4px rgba(255,148,114,0.16); }

        .primary-btn {
          position:relative; width:100%; padding:15px; border:none; border-radius:10px;
          background:linear-gradient(120deg,#FF6B81 0%,#FF9472 100%);
          color:#fff; font-family:'Space Grotesk',sans-serif; font-weight:700; font-size:15px;
          cursor:pointer; overflow:hidden;
          box-shadow:0 10px 26px rgba(255,107,129,0.38);
          transition:transform 0.15s, box-shadow 0.15s, filter 0.15s;
        }
        .primary-btn:hover { transform:translateY(-2px); filter:brightness(1.06); box-shadow:0 14px 32px rgba(255,107,129,0.5); }
        .primary-btn:active { transform:translateY(0) scale(0.99); }
        .primary-btn:disabled { cursor:progress; opacity:0.85; }
        .primary-btn .shine { position:absolute; top:-50%; left:0; width:26%; height:200%; background:rgba(255,255,255,0.45); filter:blur(10px); animation:shine 2.8s ease-in-out infinite; }

        .spinner { width:15px; height:15px; border:2px solid rgba(255,255,255,0.4); border-top-color:#fff; border-radius:50%; display:inline-block; animation:spin 0.7s linear infinite; vertical-align:-3px; margin-right:8px; }

        .toggle-eye { cursor:pointer; color:#6B7894; font-family:'Inter',sans-serif; font-size:13px; font-weight:600; background:none; border:none; padding:0; transition:color 0.15s; }
        .toggle-eye:hover { color:#FF9472; }

        a.link { color:#C0399F; text-decoration:none; font-weight:600; transition:opacity 0.15s; }
        a.link:hover { opacity:0.75; text-decoration:underline; }

        @media (max-width:880px) { .left-panel { display:none; } }
      `}</style>

      <div style={styles.shell}>
        {/* LEFT PANEL — same brand panel as LoginPage */}
        <div className="left-panel" style={styles.leftPanel}>
          <div style={styles.leftTop}>
            <div style={styles.logoMarkLight}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="2" width="18" height="20" rx="2" stroke="#FFB199" strokeWidth="1.7"/>
                <line x1="7" y1="7" x2="17" y2="7" stroke="#FFB199" strokeWidth="1.7" strokeLinecap="round"/>
                <line x1="7" y1="11" x2="17" y2="11" stroke="#fff" strokeWidth="1.7" strokeLinecap="round"/>
                <line x1="7" y1="15" x2="13" y2="15" stroke="#fff" strokeWidth="1.7" strokeLinecap="round"/>
              </svg>
            </div>
            <span style={styles.brandNameLight}>Ledgerly</span>
          </div>

          <div style={styles.leftMid}>
            <h1 style={styles.leftHeading}>Get paid faster, with less chasing</h1>
            <p style={styles.leftSub}>Create your account and let the AI agent track payments, flag risk, and follow up automatically.</p>

            <div style={styles.statsRow}>
              <div>
                <div style={styles.miniChart}>
                  {[40,65,50,85].map((h,i)=>(
                    <span key={i} className="mini-bar" style={{ ...styles.bar, height:`${h}%`, background: h===85?"#fff":"rgba(255,148,114,0.6)", animationDelay:`${0.5+i*0.1}s` }}/>
                  ))}
                </div>
                <p style={styles.statLabel}>On-time payments trending up</p>
              </div>
            </div>
          </div>

          <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:64 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L4 5v6c0 5.25 3.4 9.74 8 11 4.6-1.26 8-5.75 8-11V5l-8-3z" stroke="#FF9472" strokeWidth="1.6"/>
            </svg>
            <span style={styles.trustText}>Bank-grade encryption on every transaction</span>
          </div>
        </div>

        {/* RIGHT PANEL — signup form */}
        <div style={styles.rightPanel}>
          <div className="auth-card" style={styles.card}>
            <h2 style={styles.heading}>Create your account</h2>
            <p style={styles.subheading}>Start managing invoices in minutes</p>

            {error && (
              <div className="error-shake" style={styles.errorBox}>
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div style={styles.successBox}>
                <span>✅</span>
                <span>Account created! Redirecting you to sign in...</span>
              </div>
            )}

            {!success && (
              <form onSubmit={handleSubmit} style={styles.form}>
                <div style={styles.fieldGroup}>
                  <label style={styles.label}>Full name</label>
                  <input type="text" className="field-input" placeholder="Jane Doe" value={name} onChange={e=>setName(e.target.value)} required/>
                </div>

                <div style={styles.fieldGroup}>
                  <label style={styles.label}>Email address</label>
                  <input type="email" className="field-input" placeholder="you@company.com" value={email} onChange={e=>setEmail(e.target.value)} required/>
                </div>

                <div style={styles.fieldGroup}>
                  <label style={styles.label}>Password</label>
                  <div style={{ position:"relative" }}>
                    <input type={showPassword?"text":"password"} className="field-input" placeholder="At least 8 characters" value={password} onChange={e=>setPassword(e.target.value)} style={{ paddingRight:64 }} required minLength={8}/>
                    <button type="button" className="toggle-eye" style={{ position:"absolute", right:14, top:14 }} onClick={()=>setShowPassword(!showPassword)}>
                      {showPassword?"Hide":"Show"}
                    </button>
                  </div>
                </div>

                <button type="submit" className="primary-btn" disabled={loading}>
                  {!loading && <span className="shine"/>}
                  {loading ? <span style={{ position:"relative" }}><span className="spinner"/>Creating account...</span>
                           : <span style={{ position:"relative" }}>Create account</span>}
                </button>
              </form>
            )}

            <p style={{ textAlign:"center", fontSize:13.5, color:"#6B7894", marginTop:22, marginBottom:0 }}>
              Already have an account? <a href="/login" className="link" onClick={(e)=>{e.preventDefault(); navigate("/login");}}>Sign in</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight:"100vh", width:"100%", background:"#F4F7FC", fontFamily:"'Inter',sans-serif" },
  shell: { minHeight:"100vh", display:"flex" },
  leftPanel: { flex:"1 1 50%", background:"linear-gradient(160deg,#1A1140 0%,#3B1F73 55%,#5B2A9E 100%)", padding:"56px 56px", display:"flex", flexDirection:"column", justifyContent:"flex-start", minHeight:"100vh", boxSizing:"border-box" },
  leftTop: { display:"flex", alignItems:"center", gap:10 },
  logoMarkLight: { width:34, height:34, borderRadius:9, background:"rgba(255,255,255,0.12)", border:"1px solid rgba(255,255,255,0.28)", display:"flex", alignItems:"center", justifyContent:"center" },
  brandNameLight: { fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, fontSize:19, color:"#fff", letterSpacing:"-0.3px" },
  leftMid: { maxWidth:420, marginTop:56 },
  leftHeading: { fontFamily:"'Space Grotesk',sans-serif", fontWeight:600, fontSize:30, lineHeight:1.25, color:"#fff", margin:"0 0 16px", letterSpacing:"-0.5px" },
  leftSub: { fontSize:15, lineHeight:1.6, color:"rgba(255,255,255,0.7)", margin:"0 0 36px" },
  statsRow: { display:"flex", gap:24 },
  miniChart: { display:"flex", alignItems:"flex-end", gap:6, height:48, marginBottom:10 },
  bar: { width:10, borderRadius:3, display:"inline-block" },
  statLabel: { fontSize:12.5, color:"rgba(255,255,255,0.55)", margin:0 },
  trustText: { fontSize:12.5, color:"rgba(255,255,255,0.6)" },
  rightPanel: { flex:"1 1 50%", display:"flex", alignItems:"center", justifyContent:"center", padding:"40px 24px" },
  card: { width:"100%", maxWidth:380 },
  heading: { fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, fontSize:27, color:"#2A1149", margin:"0 0 6px", letterSpacing:"-0.4px" },
  subheading: { fontSize:14.5, color:"#6B7894", margin:"0 0 20px", lineHeight:1.5 },
  errorBox: { display:"flex", alignItems:"flex-start", gap:8, background:"#FEF2F2", border:"1px solid #FCA5A5", borderRadius:8, padding:"10px 12px", fontSize:13, color:"#B91C1C", marginBottom:16, lineHeight:1.5 },
  successBox: { display:"flex", alignItems:"flex-start", gap:8, background:"#F0FDF4", border:"1px solid #86EFAC", borderRadius:8, padding:"10px 12px", fontSize:13, color:"#15803D", marginBottom:16, lineHeight:1.5 },
  form: { display:"flex", flexDirection:"column", gap:16 },
  fieldGroup: { display:"flex", flexDirection:"column", gap:7 },
  label: { fontSize:13, fontWeight:600, color:"#2A3554", letterSpacing:"0.1px" },
};