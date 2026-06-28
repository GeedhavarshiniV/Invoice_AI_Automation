import React, { useState } from "react";
import { downloadInvoicePDF } from "../utils/generateInvoicePDF";

const ALL_INVOICES = [
  { id: "INV-1041", client: "Arjun Sharma", email: "arjun@sharma.com", amount: 18500, due: "Jun 25, 2026", issued: "Jun 10, 2026", status: "Pending", avatar: "AS", items: 3 },
  { id: "INV-1040", client: "Priya Nair", email: "priya@nair.com", amount: 42000, due: "Jun 20, 2026", issued: "Jun 05, 2026", status: "Overdue", avatar: "PN", items: 5 },
  { id: "INV-1039", client: "Karthik Rajan", email: "karthik@rajan.com", amount: 9750, due: "Jun 18, 2026", issued: "Jun 03, 2026", status: "Paid", avatar: "KR", items: 2 },
  { id: "INV-1038", client: "Meena Iyer", email: "meena@iyer.com", amount: 31200, due: "Jun 15, 2026", issued: "Jun 01, 2026", status: "Paid", avatar: "MI", items: 4 },
  { id: "INV-1037", client: "Vikram Menon", email: "vikram@menon.com", amount: 14800, due: "Jun 12, 2026", issued: "May 28, 2026", status: "Disputed", avatar: "VM", items: 3 },
  { id: "INV-1036", client: "Sneha Pillai", email: "sneha@pillai.com", amount: 22500, due: "Jun 10, 2026", issued: "May 26, 2026", status: "Paid", avatar: "SP", items: 6 },
  { id: "INV-1035", client: "Rahul Das", email: "rahul@das.com", amount: 8900, due: "Jun 08, 2026", issued: "May 24, 2026", status: "Pending", avatar: "RD", items: 1 },
  { id: "INV-1034", client: "Ananya Roy", email: "ananya@roy.com", amount: 55000, due: "Jun 05, 2026", issued: "May 21, 2026", status: "Paid", avatar: "AR", items: 7 },
  { id: "INV-1033", client: "Deepak Nair", email: "deepak@nair.com", amount: 17300, due: "Jun 02, 2026", issued: "May 18, 2026", status: "Overdue", avatar: "DN", items: 2 },
  { id: "INV-1032", client: "Kavya Menon", email: "kavya@menon.com", amount: 29800, due: "May 30, 2026", issued: "May 15, 2026", status: "Paid", avatar: "KM", items: 4 },
  { id: "INV-1031", client: "Suresh Kumar", email: "suresh@kumar.com", amount: 12400, due: "May 28, 2026", issued: "May 13, 2026", status: "Disputed", avatar: "SK", items: 2 },
  { id: "INV-1030", client: "Divya Krishnan", email: "divya@krishnan.com", amount: 38600, due: "May 25, 2026", issued: "May 10, 2026", status: "Paid", avatar: "DK", items: 5 },
];

const STATUS_STYLE = {
  Paid:     { bg: "#DCFCE7", color: "#15803D" },
  Pending:  { bg: "#FEF9C3", color: "#A16207" },
  Overdue:  { bg: "#FEE2E2", color: "#B91C1C" },
  Disputed: { bg: "#EDE9FE", color: "#6D28D9" },
};

const FILTERS = ["All", "Paid", "Pending", "Overdue", "Disputed"];

const SORT_OPTIONS = ["Newest First", "Oldest First", "Amount High-Low", "Amount Low-High"];

export default function InvoicesPage({ onNavigate }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [sort, setSort] = useState("Newest First");
  const [selected, setSelected] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [viewInvoice, setViewInvoice] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 8;

  let filtered = ALL_INVOICES.filter(inv => {
    const matchSearch = inv.client.toLowerCase().includes(search.toLowerCase()) ||
      inv.id.toLowerCase().includes(search.toLowerCase()) ||
      inv.email.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "All" || inv.status === filter;
    return matchSearch && matchFilter;
  });

  filtered = [...filtered].sort((a, b) => {
    if (sort === "Amount High-Low") return b.amount - a.amount;
    if (sort === "Amount Low-High") return a.amount - b.amount;
    if (sort === "Oldest First") return a.id.localeCompare(b.id);
    return b.id.localeCompare(a.id);
  });

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);

  const toggleSelect = (id) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  const toggleAll = () => setSelected(selected.length === paginated.length ? [] : paginated.map(i => i.id));

  const totalAmount = ALL_INVOICES.reduce((s, i) => s + i.amount, 0);
  const paidAmount = ALL_INVOICES.filter(i => i.status === "Paid").reduce((s, i) => s + i.amount, 0);
  const pendingAmount = ALL_INVOICES.filter(i => i.status === "Pending" || i.status === "Overdue").reduce((s, i) => s + i.amount, 0);

  return (
    <div style={styles.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; }

        @keyframes fadeUp { from{opacity:0;transform:translateY(10px);} to{opacity:1;transform:translateY(0);} }
        @keyframes modalIn { from{opacity:0;transform:scale(0.95);} to{opacity:1;transform:scale(1);} }
        @keyframes spin { to{transform:rotate(360deg);} }

        .inv-row { transition: background 0.15s; cursor: pointer; }
        .inv-row:hover { background: #F7F0FF; }
        .inv-row.selected { background: #F3EEFF; }

        .filter-btn {
          padding: 7px 16px; border-radius: 20px; border: 1.5px solid #E2E8F4;
          background: #fff; color: #6B7894; font-family: 'Inter', sans-serif;
          font-size: 13px; font-weight: 500; cursor: pointer;
          transition: all 0.15s ease;
        }
        .filter-btn:hover { border-color: #C4B5FD; color: #5B2A9E; }
        .filter-btn.active { background: #5B2A9E; color: #fff; border-color: #5B2A9E; }

        .action-btn {
          padding: 9px 18px; border-radius: 8px; border: none; cursor: pointer;
          font-family: 'Inter', sans-serif; font-size: 13.5px; font-weight: 600;
          transition: transform 0.12s, filter 0.12s;
        }
        .action-btn:hover { transform: translateY(-1px); filter: brightness(1.07); }
        .action-btn.primary { background: linear-gradient(120deg,#FF6B81,#FF9472); color: #fff; box-shadow: 0 6px 16px rgba(255,107,129,0.3); }
        .action-btn.ghost { background: #fff; color: #5B2A9E; border: 1.5px solid #E2E8F4; }
        .action-btn.danger { background: #FEE2E2; color: #B91C1C; }

        .search-input {
          width: 100%; padding: 10px 16px 10px 40px; border-radius: 9px;
          border: 1.5px solid #E2E8F4; background: #F7F9FC;
          font-family: 'Inter', sans-serif; font-size: 14px; color: #2A3554; outline: none;
          transition: border-color 0.18s, box-shadow 0.18s;
        }
        .search-input:focus { border-color: #A78BFA; box-shadow: 0 0 0 4px rgba(167,139,250,0.12); background: #fff; }
        .search-input::placeholder { color: #9AA7C2; }

        .sort-select {
          padding: 9px 14px; border-radius: 9px; border: 1.5px solid #E2E8F4;
          background: #fff; font-family: 'Inter', sans-serif; font-size: 13.5px;
          color: #2A3554; outline: none; cursor: pointer;
        }
        .sort-select:focus { border-color: #A78BFA; }

        .page-btn {
          width: 34px; height: 34px; border-radius: 8px; border: 1.5px solid #E2E8F4;
          background: #fff; color: #2A3554; font-size: 13px; font-weight: 600;
          cursor: pointer; display: flex; align-items: center; justify-content: center;
          transition: all 0.15s;
        }
        .page-btn:hover { border-color: #A78BFA; color: #5B2A9E; }
        .page-btn.active { background: #5B2A9E; color: #fff; border-color: #5B2A9E; }
        .page-btn:disabled { opacity: 0.4; cursor: not-allowed; }

        .modal-overlay { position:fixed; inset:0; background:rgba(26,17,64,0.5); z-index:999; display:flex; align-items:center; justify-content:center; backdrop-filter:blur(4px); }
        .modal-box { background:#fff; border-radius:18px; padding:32px; width:520px; max-width:95vw; animation:modalIn 0.25s ease; box-shadow:0 24px 60px rgba(26,17,64,0.25); }

        .checkbox-custom { width:16px; height:16px; accent-color:#5B2A9E; cursor:pointer; }

        ::-webkit-scrollbar { width:6px; }
        ::-webkit-scrollbar-track { background:#F4F7FC; }
        ::-webkit-scrollbar-thumb { background:#D0BDF4; border-radius:6px; }
      `}</style>

      {/* TOPBAR */}
      <div style={styles.topbar}>
        <div>
          <h1 style={styles.pageTitle}>Invoices</h1>
          <p style={styles.pageSubtitle}>{ALL_INVOICES.length} total invoices · {filtered.length} shown</p>
        </div>
        <div style={{ display:"flex", gap:10 }}>
          {selected.length > 0 && (
            <button className="action-btn danger">🗑 Delete ({selected.length})</button>
          )}
          <button className="action-btn ghost">📤 Export CSV</button>
          <button className="action-btn primary" onClick={() => setShowModal(true)}>+ New Invoice</button>
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <div style={styles.summaryRow}>
        {[
          { label: "Total Billed", value: `₹${totalAmount.toLocaleString()}`, icon: "📋", color: "#5B2A9E", bg: "#F3EEFF" },
          { label: "Collected", value: `₹${paidAmount.toLocaleString()}`, icon: "✅", color: "#16A34A", bg: "#DCFCE7" },
          { label: "Outstanding", value: `₹${pendingAmount.toLocaleString()}`, icon: "⏳", color: "#D97706", bg: "#FEF9C3" },
          { label: "Total Invoices", value: ALL_INVOICES.length, icon: "📄", color: "#0EA5E9", bg: "#E0F2FE" },
        ].map((s, i) => (
          <div key={i} style={{ ...styles.summaryCard, animationDelay: `${i * 0.07}s` }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div>
                <p style={{ margin:"0 0 4px", fontSize:12, fontWeight:700, color:"#9AA7C2", textTransform:"uppercase", letterSpacing:"0.5px" }}>{s.label}</p>
                <p style={{ margin:0, fontFamily:"'Space Grotesk',sans-serif", fontSize:24, fontWeight:700, color:"#1A1140" }}>{s.value}</p>
              </div>
              <div style={{ width:44, height:44, borderRadius:12, background:s.bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>{s.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* FILTERS + SEARCH */}
      <div style={styles.controlsRow}>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
          {FILTERS.map(f => (
            <button key={f} className={`filter-btn${filter===f?" active":""}`} onClick={() => { setFilter(f); setCurrentPage(1); }}>
              {f}
              <span style={{ marginLeft:6, fontSize:11, opacity:0.75 }}>
                {f==="All" ? ALL_INVOICES.length : ALL_INVOICES.filter(i=>i.status===f).length}
              </span>
            </button>
          ))}
        </div>
        <div style={{ display:"flex", gap:10, alignItems:"center" }}>
          <div style={{ position:"relative", width:240 }}>
            <span style={{ position:"absolute", left:12, top:11, fontSize:14, color:"#9AA7C2" }}>🔍</span>
            <input className="search-input" placeholder="Search by name, ID, email..." value={search} onChange={e => { setSearch(e.target.value); setCurrentPage(1); }} />
          </div>
          <select className="sort-select" value={sort} onChange={e => setSort(e.target.value)}>
            {SORT_OPTIONS.map(o => <option key={o}>{o}</option>)}
          </select>
        </div>
      </div>

      {/* TABLE */}
      <div style={styles.tableCard}>
        <table style={styles.table}>
          <thead>
            <tr style={{ borderBottom:"2px solid #F0EAF8" }}>
              <th style={styles.th}>
                <input type="checkbox" className="checkbox-custom" checked={selected.length === paginated.length && paginated.length > 0} onChange={toggleAll} />
              </th>
              {["Invoice ID", "Client", "Issued", "Due Date", "Amount", "Items", "Status", "Actions"].map(h => (
                <th key={h} style={styles.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr><td colSpan={9} style={{ textAlign:"center", padding:"48px 0", color:"#9AA7C2", fontSize:15 }}>No invoices found</td></tr>
            ) : paginated.map((inv, i) => (
              <tr key={inv.id} className={`inv-row${selected.includes(inv.id)?" selected":""}`} style={{ borderBottom:"1px solid #F4F0FC" }}>
                <td style={styles.td}>
                  <input type="checkbox" className="checkbox-custom" checked={selected.includes(inv.id)} onChange={() => toggleSelect(inv.id)} onClick={e => e.stopPropagation()} />
                </td>
                <td style={styles.td}><span style={{ fontWeight:700, color:"#5B2A9E", fontSize:13 }}>{inv.id}</span></td>
                <td style={styles.td}>
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <div style={{ width:34, height:34, borderRadius:"50%", background:`hsl(${inv.client.charCodeAt(0)*5%360},55%,68%)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, color:"#fff", flexShrink:0 }}>
                      {inv.avatar}
                    </div>
                    <div>
                      <p style={{ margin:0, fontWeight:600, fontSize:13.5, color:"#1A1140" }}>{inv.client}</p>
                      <p style={{ margin:0, fontSize:12, color:"#9AA7C2" }}>{inv.email}</p>
                    </div>
                  </div>
                </td>
                <td style={styles.td}><span style={{ fontSize:13, color:"#9AA7C2" }}>{inv.issued}</span></td>
                <td style={styles.td}><span style={{ fontSize:13, color: inv.status==="Overdue"?"#B91C1C":"#4A5578", fontWeight: inv.status==="Overdue"?600:400 }}>{inv.due}</span></td>
                <td style={styles.td}><span style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, fontSize:14, color:"#1A1140" }}>₹{inv.amount.toLocaleString()}</span></td>
                <td style={styles.td}><span style={{ fontSize:13, color:"#6B7894" }}>{inv.items} items</span></td>
                <td style={styles.td}>
                  <span style={{ padding:"4px 12px", borderRadius:20, fontSize:12, fontWeight:600, background:STATUS_STYLE[inv.status].bg, color:STATUS_STYLE[inv.status].color }}>
                    {inv.status}
                  </span>
                </td>
                <td style={styles.td}>
                  <div style={{ display:"flex", gap:6 }}>
                    <button onClick={() => setViewInvoice(inv)} style={{ background:"none", border:"1.5px solid #E2E8F4", borderRadius:7, padding:"5px 12px", fontSize:12, fontWeight:600, color:"#5B2A9E", cursor:"pointer", transition:"all 0.15s" }}
                      onMouseOver={e=>e.currentTarget.style.borderColor="#A78BFA"}
                      onMouseOut={e=>e.currentTarget.style.borderColor="#E2E8F4"}>
                      View
                    </button>
                    <button onClick={() => downloadInvoicePDF(inv)} title={`Download ${inv.id} as PDF`} style={{ background:"none", border:"1.5px solid #E2E8F4", borderRadius:7, padding:"5px 12px", fontSize:12, fontWeight:600, color:"#5B2A9E", cursor:"pointer", transition:"all 0.15s" }}
                      onMouseOver={e=>e.currentTarget.style.borderColor="#A78BFA"}
                      onMouseOut={e=>e.currentTarget.style.borderColor="#E2E8F4"}>
                      ⬇ PDF
                    </button>
                    {(inv.status === "Pending" || inv.status === "Overdue") && (
                      <button style={{ background:"none", border:"1.5px solid #FCA5A5", borderRadius:7, padding:"5px 12px", fontSize:12, fontWeight:600, color:"#DC2626", cursor:"pointer" }}>
                        Remind
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* PAGINATION */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"16px 0 4px" }}>
          <p style={{ fontSize:13, color:"#9AA7C2", margin:0 }}>
            Showing {Math.min((currentPage-1)*perPage+1, filtered.length)}–{Math.min(currentPage*perPage, filtered.length)} of {filtered.length} invoices
          </p>
          <div style={{ display:"flex", gap:6 }}>
            <button className="page-btn" disabled={currentPage===1} onClick={()=>setCurrentPage(p=>p-1)}>‹</button>
            {Array.from({length:totalPages},(_,i)=>i+1).map(p=>(
              <button key={p} className={`page-btn${currentPage===p?" active":""}`} onClick={()=>setCurrentPage(p)}>{p}</button>
            ))}
            <button className="page-btn" disabled={currentPage===totalPages} onClick={()=>setCurrentPage(p=>p+1)}>›</button>
          </div>
        </div>
      </div>

      {/* NEW INVOICE MODAL */}
      {showModal && (
        <div className="modal-overlay" onClick={()=>setShowModal(false)}>
          <div className="modal-box" onClick={e=>e.stopPropagation()}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
              <h2 style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:20, fontWeight:700, color:"#1A1140", margin:0 }}>Create New Invoice</h2>
              <button onClick={()=>setShowModal(false)} style={{ background:"none", border:"none", fontSize:22, color:"#9AA7C2", cursor:"pointer" }}>×</button>
            </div>
            {[
              { label:"Client Name", placeholder:"e.g. Arjun Sharma", type:"text" },
              { label:"Client Email", placeholder:"e.g. arjun@company.com", type:"email" },
              { label:"Amount (₹)", placeholder:"e.g. 25000", type:"number" },
              { label:"Due Date", placeholder:"", type:"date" },
            ].map(field => (
              <div key={field.label} style={{ marginBottom:16 }}>
                <label style={{ fontSize:13, fontWeight:600, color:"#2A3554", display:"block", marginBottom:6 }}>{field.label}</label>
                <input type={field.type} placeholder={field.placeholder} style={{ width:"100%", padding:"11px 14px", borderRadius:9, border:"1.5px solid #E2E8F4", fontSize:14, fontFamily:"'Inter',sans-serif", outline:"none", color:"#1A1140", background:"#F7F9FC" }}
                  onFocus={e=>{e.target.style.borderColor="#A78BFA";e.target.style.background="#fff";}}
                  onBlur={e=>{e.target.style.borderColor="#E2E8F4";e.target.style.background="#F7F9FC";}} />
              </div>
            ))}
            <div style={{ marginBottom:20 }}>
              <label style={{ fontSize:13, fontWeight:600, color:"#2A3554", display:"block", marginBottom:6 }}>Description</label>
              <textarea placeholder="Invoice description..." rows={3} style={{ width:"100%", padding:"11px 14px", borderRadius:9, border:"1.5px solid #E2E8F4", fontSize:14, fontFamily:"'Inter',sans-serif", outline:"none", resize:"vertical", color:"#1A1140", background:"#F7F9FC" }}
                onFocus={e=>{e.target.style.borderColor="#A78BFA";e.target.style.background="#fff";}}
                onBlur={e=>{e.target.style.borderColor="#E2E8F4";e.target.style.background="#F7F9FC";}} />
            </div>
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={()=>setShowModal(false)} className="action-btn ghost" style={{ flex:1 }}>Cancel</button>
              <button className="action-btn primary" style={{ flex:2 }} onClick={()=>setShowModal(false)}>Create Invoice</button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW INVOICE MODAL */}
      {viewInvoice && (
        <div className="modal-overlay" onClick={()=>setViewInvoice(null)}>
          <div className="modal-box" onClick={e=>e.stopPropagation()} style={{ width:560 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:24 }}>
              <div>
                <h2 style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:20, fontWeight:700, color:"#1A1140", margin:"0 0 4px" }}>{viewInvoice.id}</h2>
                <span style={{ padding:"4px 12px", borderRadius:20, fontSize:12, fontWeight:600, background:STATUS_STYLE[viewInvoice.status].bg, color:STATUS_STYLE[viewInvoice.status].color }}>{viewInvoice.status}</span>
              </div>
              <button onClick={()=>setViewInvoice(null)} style={{ background:"none", border:"none", fontSize:22, color:"#9AA7C2", cursor:"pointer" }}>×</button>
            </div>
            <div style={{ background:"#F7F9FC", borderRadius:12, padding:"16px 20px", marginBottom:20 }}>
              <div style={{ display:"flex", gap:10, alignItems:"center", marginBottom:12 }}>
                <div style={{ width:42, height:42, borderRadius:"50%", background:`hsl(${viewInvoice.client.charCodeAt(0)*5%360},55%,68%)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:700, color:"#fff" }}>{viewInvoice.avatar}</div>
                <div>
                  <p style={{ margin:0, fontWeight:700, fontSize:15, color:"#1A1140" }}>{viewInvoice.client}</p>
                  <p style={{ margin:0, fontSize:13, color:"#9AA7C2" }}>{viewInvoice.email}</p>
                </div>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                {[
                  { label:"Amount", value:`₹${viewInvoice.amount.toLocaleString()}` },
                  { label:"Items", value:`${viewInvoice.items} line items` },
                  { label:"Issued", value:viewInvoice.issued },
                  { label:"Due Date", value:viewInvoice.due },
                ].map(d=>(
                  <div key={d.label} style={{ background:"#fff", borderRadius:8, padding:"10px 14px" }}>
                    <p style={{ margin:"0 0 2px", fontSize:11.5, fontWeight:600, color:"#9AA7C2", textTransform:"uppercase" }}>{d.label}</p>
                    <p style={{ margin:0, fontSize:14, fontWeight:600, color:"#1A1140" }}>{d.value}</p>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display:"flex", gap:10 }}>
              <button className="action-btn ghost" style={{ flex:1 }}>📤 Send Reminder</button>
              <button onClick={() => downloadInvoicePDF(viewInvoice)} className="action-btn ghost" style={{ flex:1 }}>⬇ Download PDF</button>
              <button className="action-btn primary" style={{ flex:1 }}>✏️ Edit</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  page: { fontFamily:"'Inter',sans-serif", padding:"28px 32px", minHeight:"100vh", background:"#F4F7FC" },
  topbar: { display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 },
  pageTitle: { fontFamily:"'Space Grotesk',sans-serif", fontSize:24, fontWeight:700, color:"#1A1140", margin:0, letterSpacing:"-0.4px" },
  pageSubtitle: { fontSize:13.5, color:"#6B7894", margin:"4px 0 0" },
  summaryRow: { display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16, marginBottom:22 },
  summaryCard: { background:"#fff", borderRadius:14, padding:"18px 20px", boxShadow:"0 2px 12px rgba(91,42,158,0.07)", border:"1px solid #F0EAF8", animation:"fadeUp 0.4s ease both" },
  controlsRow: { display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16, flexWrap:"wrap", gap:12 },
  tableCard: { background:"#fff", borderRadius:14, padding:"20px 24px", boxShadow:"0 2px 12px rgba(91,42,158,0.07)", border:"1px solid #F0EAF8" },
  table: { width:"100%", borderCollapse:"collapse" },
  th: { textAlign:"left", fontSize:11.5, fontWeight:700, color:"#9AA7C2", textTransform:"uppercase", letterSpacing:"0.5px", padding:"0 12px 14px 0" },
  td: { padding:"13px 12px 13px 0", verticalAlign:"middle" },
};