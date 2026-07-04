import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api/client";

const STATUS_COLOR = {
  Paid:     { bg: "#DCFCE7", color: "#15803D" },
  Pending:  { bg: "#FEF9C3", color: "#A16207" },
  Overdue:  { bg: "#FEE2E2", color: "#B91C1C" },
  Disputed: { bg: "#FEE2E2", color: "#B91C1C" },
};

function fmt(n) {
  return "Rs. " + Math.round(n || 0).toLocaleString("en-IN");
}

function fmtDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export default function TrackerPublicPage() {
  const { invoiceNumber } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api
      .trackInvoice(invoiceNumber)
      .then((data) => setInvoice(data))
      .catch(() => setError("We couldn't find that invoice."));
  }, [invoiceNumber]);

  if (error) {
    return (
      <div style={{ textAlign: "center", padding: "80px 20px", fontFamily: "'Inter',sans-serif" }}>
        <p style={{ fontSize: 15, color: "#B91C1C", fontWeight: 600 }}>{error}</p>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div style={{ textAlign: "center", padding: "80px 20px", fontFamily: "'Inter',sans-serif", color: "#9AA7C2" }}>
        Loading…
      </div>
    );
  }

  const statusStyle = STATUS_COLOR[invoice.status] || STATUS_COLOR.Pending;

  return (
    <div style={{ background: "#F4F6FB", minHeight: "100vh", padding: "40px 20px", fontFamily: "'Inter',sans-serif" }}>
      <div style={{ maxWidth: 760, margin: "0 auto", background: "#fff", borderRadius: 16, padding: 44, boxShadow: "0 8px 30px rgba(91,42,158,0.08)" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1px solid #EEF0F5", paddingBottom: 22, marginBottom: 26 }}>
          <div>
            <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 800, fontSize: 24, color: "#1A1140" }}>
              Ledgerly AI Solutions
            </div>
            <div style={{ fontSize: 13, color: "#6B7894", marginTop: 8, lineHeight: 1.7 }}>
              +91 93420 47341<br />
              Chennai, Tamil Nadu, India<br />
              support@ledgerly.ai
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 800, fontSize: 30, color: "#5B2A9E", letterSpacing: 1 }}>
              INVOICE
            </div>
            <div style={{ height: 2, width: 90, background: "#FF6B81", marginLeft: "auto", marginTop: 4, marginBottom: 10 }} />
            <div style={{ fontSize: 13, lineHeight: 1.9 }}>
              <div><span style={{ color: "#9AA7C2" }}>DATE: </span><b style={{ color: "#1A1140" }}>{fmtDate(invoice.issued_date)}</b></div>
              <div><span style={{ color: "#9AA7C2" }}>INVOICE #: </span><b style={{ color: "#1A1140" }}>{invoice.invoice_number}</b></div>
              <div><span style={{ color: "#9AA7C2" }}>STATUS: </span><b style={{ color: "#1A1140" }}>{invoice.status.toUpperCase()}</b></div>
              <div><span style={{ color: "#9AA7C2" }}>FOR: </span><b style={{ color: "#1A1140" }}>{invoice.client_name}</b></div>
            </div>
          </div>
        </div>

        {/* Bill To / Invoice Details */}
        <div style={{ display: "flex", gap: 20, marginBottom: 30 }}>
          <div style={{ flex: 1, background: "#F7F9FC", borderRadius: 12, padding: "18px 20px" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#5B2A9E", marginBottom: 10, letterSpacing: 0.5 }}>BILL TO</div>
            <div style={{ fontWeight: 700, fontSize: 15, color: "#1A1140" }}>{invoice.client_name}</div>
            <div style={{ fontSize: 13, color: "#6B7894", marginTop: 4 }}>{invoice.client_email}</div>
          </div>
          <div style={{ flex: 1, background: "#F7F9FC", borderRadius: 12, padding: "18px 20px" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#5B2A9E", marginBottom: 10, letterSpacing: 0.5 }}>INVOICE DETAILS</div>
            <div style={{ fontSize: 13, color: "#6B7894", display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
              <span>Due Date</span><b style={{ color: "#1A1140" }}>{fmtDate(invoice.due_date)}</b>
            </div>
            <div style={{ fontSize: 13, color: "#6B7894", display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
              <span>Category</span><b style={{ color: "#1A1140", textTransform: "capitalize" }}>{invoice.category || "Default"}</b>
            </div>
            <div style={{ fontSize: 13, color: "#6B7894", display: "flex", justifyContent: "space-between" }}>
              <span>Tax Type</span><b style={{ color: "#1A1140" }}>{invoice.tax_type || "—"}</b>
            </div>
          </div>
        </div>

        {/* Description table */}
        <div style={{ borderRadius: 10, overflow: "hidden", marginBottom: 4 }}>
          <div style={{ display: "flex", justifyContent: "space-between", background: "#5B2A9E", color: "#fff", padding: "12px 18px", fontSize: 12, fontWeight: 700, letterSpacing: 0.5 }}>
            <span>DESCRIPTION</span>
            <span>AMOUNT</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "16px 18px", borderBottom: "1px solid #EEF0F5", fontSize: 14, color: "#1A1140" }}>
            <span>{invoice.description || "Default services"}</span>
            <span>{fmt(invoice.amount)}</span>
          </div>
        </div>

        {/* Subtotal / tax */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 14, marginBottom: 20 }}>
          <div style={{ width: 260 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#6B7894", padding: "4px 0" }}>
              <span>Subtotal</span><span>{fmt(invoice.amount)}</span>
            </div>
            {invoice.tax_type === "IGST" && invoice.igst > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#6B7894", padding: "4px 0" }}>
                <span>IGST</span><span>{fmt(invoice.igst)}</span>
              </div>
            )}
            {invoice.tax_type !== "IGST" && (invoice.cgst > 0 || invoice.sgst > 0) && (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#6B7894", padding: "4px 0" }}>
                  <span>CGST</span><span>{fmt(invoice.cgst)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#6B7894", padding: "4px 0" }}>
                  <span>SGST</span><span>{fmt(invoice.sgst)}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Total due banner */}
        <div style={{
          background: "linear-gradient(120deg,#FF6B81,#FF9472)",
          borderRadius: 12,
          padding: "16px 24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          color: "#fff",
          marginBottom: 24,
        }}>
          <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 15 }}>TOTAL DUE</span>
          <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 800, fontSize: 22 }}>{fmt(invoice.total_amount)}</span>
        </div>

        {/* Status pill */}
        <div style={{ textAlign: "center" }}>
          <span style={{
            display: "inline-block",
            fontSize: 12, fontWeight: 700, padding: "6px 16px", borderRadius: 20,
            background: statusStyle.bg, color: statusStyle.color,
          }}>
            {invoice.status === "Paid" ? "✅ " : invoice.status === "Overdue" ? "⚠️ " : "⏳ "}
            {invoice.status}
            {invoice.paid_date && ` · Paid ${fmtDate(invoice.paid_date)}`}
          </span>
        </div>
      </div>
    </div>
  );
}