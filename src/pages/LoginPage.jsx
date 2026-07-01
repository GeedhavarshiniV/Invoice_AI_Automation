import { loginUser } from "../api";
import React, { useState, useEffect } from "react";
import SEO from "../components/SEO";

export default function LoginPage({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stamped, setStamped] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setStamped(true), 500);
    return () => clearTimeout(t);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);

    try {
        const data = await loginUser(email, password);

        console.log("Login Success:", data);

        // Store JWT token
        localStorage.setItem("token", data.access_token);

        // Send user data to parent
        onLogin({
            email: data.user_email,
            name: data.user_name
        });

    } catch (error) {

        alert(error.message);

    } finally {

        setLoading(false);

    }
};

  return (
    <div style={styles.page}>
      <SEO
        title="Sign In"
        description="Sign in to your Ledgerly account to manage invoices, track payments, and let the AI agent handle follow-ups and disputes."
        path="/login"
        noIndex
      />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; }

        @keyframes panelIn { from { opacity:0; transform:translateX(24px);} to { opacity:1; transform:translateX(0);} }
        @keyframes cardIn { from { opacity:0; transform:translateY(16px);} to { opacity:1; transform:translateY(0);} }
        @keyframes corePop { 0%{transform:scale(0);opacity:0;} 60%{transform:scale(1.12);opacity:1;} 100%{transform:scale(1);opacity:1;} }
        @keyframes drawCheck { to { stroke-dashoffset: 0; } }
        @keyframes ringExpand { 0%{stroke-dashoffset:201;} 100%{stroke-dashoffset:0;} }
        @keyframes barGrow { from{transform:scaleY(0);} to{transform:scaleY(1);} }
        @keyframes floatSlow { 0%,100%{transform:translateY(0);} 50%{transform:translateY(-10px);} }
        @keyframes spin { to{transform:rotate(360deg);} }
        @keyframes blink { 0%,100%{opacity:1;} 50%{opacity:0.2;} }
        @keyframes shake { 0%,100%{transform:translateX(0);} 20%,60%{transform:translateX(-8px);} 40%,80%{transform:translateX(8px);} }
        @keyframes glowIn { 0%{opacity:0;transform:scale(0.6);} 100%{opacity:1;transform:scale(1);} }
        @keyframes shine { 0%{transform:translateX(-130%) rotate(20deg);} 100%{transform:translateX(230%) rotate(20deg);} }

        .left-panel { animation: panelIn 0.7s cubic-bezier(0.16,1,0.3,1) both; }
        .auth-card { animation: cardIn 0.6s cubic-bezier(0.16,1,0.3,1) 0.15s both; }
        .badge-ring-fg { stroke-dasharray:201; stroke-dashoffset:201; animation:ringExpand 1s ease-out 0.2s forwards; }
        .badge-glow { position:absolute; top:6px; left:6px; width:64px; height:64px; border-radius:50%; background:radial-gradient(circle, rgba(255,107,129,0.55) 0%, transparent 70%); opacity:0; animation:glowIn 0.6s ease-out 0.85s forwards; pointer-events:none; }
        .badge-core { transform-origin:38px 38px; transform:scale(0); opacity:0; animation:corePop 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.9s forwards; }
        .badge-check { stroke-dasharray:36; stroke-dashoffset:36; animation:drawCheck 0.4s ease-out 1.35s forwards; }
        .float-icon { animation:floatSlow 5s ease-in-out infinite; }
        .mini-bar { transform-origin:bottom; animation:barGrow 0.6s ease-out both; }
        .cursor-blink { display:inline-block; width:2px; height:13px; background:#FF9472; margin-left:2px; animation:blink 1s step-end infinite; vertical-align:middle; }
        .error-shake { animation:shake 0.4s ease; }

        .field-input {
          width:100%; padding:13px 16px;
          background:#F7F9FC; border:1.5px solid #E2E8F4; border-radius:10px;
          color:#0F1E3D; font-family:'Inter',sans-serif; font-size:15px; outline:none;
          transition:border-color 0.18s, box-shadow 0.18s, background 0.18s;
        }
        .field-input::placeholder { color:#9AA7C2; }
        .field-input:focus { border-color:#FF9472; background:#fff; box-shadow:0 0 0 4px rgba(255,148,114,0.16); }
        .field-input.error { border-color:#EF4444; box-shadow:0 0 0 4px rgba(239,68,68,0.14); }

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

        .sso-btn { width:100%; padding:12px; border-radius:10px; border:1.5px solid #E2E8F4; background:#fff; color:#2A3554; font-family:'Inter',sans-serif; font-weight:600; font-size:14px; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:10px; transition:background 0.18s, transform 0.12s; }
        .sso-btn:hover { background:#F7F9FC; transform:translateY(-1px); }

        a.link { color:#C0399F; text-decoration:none; font-weight:600; transition:opacity 0.15s; }
        a.link:hover { opacity:0.75; text-decoration:underline; }

        .trust-row { display:flex; align-items:center; gap:8px; }

        @media (max-width:880px) { .left-panel { display:none; } }
        @media (prefers-reduced-motion:reduce) {
          .left-panel,.auth-card,.badge-ring-fg,.badge-glow,.badge-core,.badge-check,.mini-bar,.float-icon,.cursor-blink { animation:none!important; }
          .badge-ring-fg { stroke-dashoffset:0!important; }
          .badge-glow { opacity:1!important; transform:scale(1)!important; }
          .badge-core { transform:scale(1)!important; opacity:1!important; }
          .badge-check { stroke-dashoffset:0!important; }
        }
      `}</style>

      <div style={styles.shell}>
        {/* LEFT PANEL */}
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
            <div className="float-icon" style={{ position:"relative", width:76, height:76, marginBottom:28, marginLeft:16 }}>
              <div className="badge-glow" />
              <svg width="76" height="76" viewBox="0 0 76 76" style={{ display:"block", overflow:"visible" }}>
                <defs>
                  <linearGradient id="badgeFill" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FF9472"/>
                    <stop offset="100%" stopColor="#FF6B81"/>
                  </linearGradient>
                </defs>
                <circle className="badge-ring-bg" cx="38" cy="38" r="32" fill="none" stroke="#fff" strokeWidth="1.5" opacity="0.25"/>
                <circle className="badge-ring-fg" cx="38" cy="38" r="32" fill="none" stroke="#FF9472" strokeWidth="2" strokeLinecap="round" transform="rotate(-90 38 38)"/>
                <circle className="badge-core" cx="38" cy="38" r="24" fill="url(#badgeFill)"/>
                <path className="badge-check" d="M27 39 L34.5 46.5 L51 28" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>

            <h1 style={styles.leftHeading}>Invoices you can trust, resolved without the back-and-forth</h1>
            <p style={styles.leftSub}>Track payments, manage disputes, and get notified the moment something needs your attention.</p>

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

          <div className="trust-row" style={{ marginTop:64 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L4 5v6c0 5.25 3.4 9.74 8 11 4.6-1.26 8-5.75 8-11V5l-8-3z" stroke="#FF9472" strokeWidth="1.6"/>
            </svg>
            <span style={styles.trustText}>Bank-grade encryption on every transaction</span>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div style={styles.rightPanel}>
          <div className="auth-card" style={styles.card}>
            <h2 style={styles.heading}>Welcome back</h2>
            <p style={styles.subheading}>Sign in to your account <span className="cursor-blink"/></p>

            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Email address</label>
                <input type="email" className="field-input" placeholder="you@company.com" value={email} onChange={e=>{setEmail(e.target.value);}} required/>
              </div>

              <div style={styles.fieldGroup}>
                <div style={styles.labelRow}>
                  <label style={styles.label}>Password</label>
                  <a href="#" className="link" style={{ fontSize:13 }}>Forgot password?</a>
                </div>
                <div style={{ position:"relative" }}>
                  <input type={showPassword?"text":"password"} className="field-input" placeholder="••••••••" value={password} onChange={e=>{setPassword(e.target.value);}} style={{ paddingRight:64 }} required/>
                  <button type="button" className="toggle-eye" style={{ position:"absolute", right:14, top:14 }} onClick={()=>setShowPassword(!showPassword)}>
                    {showPassword?"Hide":"Show"}
                  </button>
                </div>
              </div>

              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", margin:"-4px 0 2px" }}>
                <label style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer" }}>
                  <input type="checkbox" style={{ accentColor:"#C0399F", width:16, height:16 }}/>
                  <span style={{ fontSize:13.5, color:"#4A5578" }}>Remember me</span>
                </label>
              </div>

              <button type="submit" className="primary-btn" disabled={loading}>
                {!loading && <span className="shine"/>}
                {loading ? <span style={{ position:"relative" }}><span className="spinner"/>Verifying...</span>
                         : <span style={{ position:"relative" }}>Sign in</span>}
              </button>
            </form>

            <div style={styles.dividerRow}>
              <div style={styles.dividerLine}/><span style={styles.dividerText}>or continue with</span><div style={styles.dividerLine}/>
            </div>

            <button className="sso-btn" type="button">
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.25 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>

            <p style={{ textAlign:"center", fontSize:13.5, color:"#6B7894", marginTop:22, marginBottom:0 }}>
              New to Ledgerly? <a href="#" className="link">Create an account</a>
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
  form: { display:"flex", flexDirection:"column", gap:16 },
  fieldGroup: { display:"flex", flexDirection:"column", gap:7 },
  labelRow: { display:"flex", justifyContent:"space-between", alignItems:"center" },
  label: { fontSize:13, fontWeight:600, color:"#2A3554", letterSpacing:"0.1px" },
  dividerRow: { display:"flex", alignItems:"center", gap:12, margin:"24px 0 18px" },
  dividerLine: { flex:1, height:1, background:"#E2E8F4" },
  dividerText: { fontSize:12.5, color:"#9AA7C2", whiteSpace:"nowrap" },
};