import jsPDF from "jspdf";

// ---- Your business details ----
const SELLER = {
  name: "Ledgerly AI Solutions",
  phone: "+91 93420 47341",
  address: "Chennai, Tamil Nadu, India",
  email: "support@ledgerly.ai",
};

const BANK = {
  bankName: "HDFC Bank",
  accountNumber: "50100123456789",
  ifsc: "HDFC0001234",
  branch: "Chennai Main Branch",
};

// ---- Brand colors (matches the app's UI) ----
const COLOR = {
  purple: [91, 42, 158],        // #5B2A9E — primary brand purple
  purpleLight: [243, 238, 255], // #F3EEFF — light purple background
  pink: [255, 107, 129],        // #FF6B81 — accent gradient start
  dark: [26, 17, 64],           // #1A1140 — heading text
  gray: [107, 120, 148],        // #6B7894 — secondary text
  grayLight: [154, 167, 194],   // #9AA7C2 — muted labels
  bgLight: [247, 249, 252],     // #F7F9FC — light panel background
  border: [226, 232, 244],      // #E2E8F4 — light border
  white: [255, 255, 255],
};

function money(n) {
  return "Rs. " + Math.round(n || 0).toLocaleString("en-IN");
}

export function generateInvoicePDF(invoice) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = 595;
  const margin = 48;
  const contentWidth = pageWidth - margin * 2;
  let y = 56;

  const setFill = (c) => doc.setFillColor(c[0], c[1], c[2]);
  const setText = (c) => doc.setTextColor(c[0], c[1], c[2]);
  const setDraw = (c) => doc.setDrawColor(c[0], c[1], c[2]);

  // ---- Header: seller details (left) + INVOICE wordmark (right) ----
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  setText(COLOR.dark);
  doc.text(SELLER.name, margin, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  setText(COLOR.gray);
  doc.text(SELLER.phone, margin, y + 17);
  doc.text(SELLER.address, margin, y + 31);
  doc.text(SELLER.email, margin, y + 45);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  setText(COLOR.purple);
  doc.text("INVOICE", pageWidth - margin, y + 4, { align: "right" });
  setDraw(COLOR.pink);
  doc.setLineWidth(2);
  doc.line(pageWidth - margin - 70, y + 10, pageWidth - margin, y + 10);

  // Meta rows top-right: DATE / INVOICE # / STATUS / FOR
  let metaY = y + 30;
  const metaRows = [
    ["DATE", invoice.issued || "-"],
    ["INVOICE #", invoice.displayId || invoice.invoice_number || "-"],
    ["STATUS", (invoice.status || "PENDING").toUpperCase()],
    ["FOR", invoice.client || "-"],
  ];
  metaRows.forEach(([label, value]) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    setText(COLOR.grayLight);
    doc.text(label + ":", pageWidth - margin - 150, metaY);
    doc.setFont("helvetica", "bold");
    setText(COLOR.dark);
    doc.text(String(value), pageWidth - margin, metaY, { align: "right" });
    metaY += 14;
  });

  y += 74;
  setDraw(COLOR.border);
  doc.setLineWidth(1);
  doc.line(margin, y, pageWidth - margin, y);
  y += 22;

  // ---- BILL TO + INVOICE DETAILS panels (light background) ----
  const panelHeight = 90;
  const panelGap = 16;
  const panelWidth = (contentWidth - panelGap) / 2;

  setFill(COLOR.bgLight);
  doc.roundedRect(margin, y, panelWidth, panelHeight, 6, 6, "F");
  doc.roundedRect(margin + panelWidth + panelGap, y, panelWidth, panelHeight, 6, 6, "F");

  // BILL TO (left panel)
  let by = y + 20;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  setText(COLOR.purple);
  doc.text("BILL TO", margin + 14, by);
  by += 16;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  setText(COLOR.dark);
  doc.text(invoice.client || "-", margin + 14, by);
  by += 14;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  setText(COLOR.gray);
  if (invoice.client_address) { doc.text(invoice.client_address, margin + 14, by); by += 12; }
  if (invoice.email) { doc.text(invoice.email, margin + 14, by); by += 12; }
  if (invoice.client_phone) { doc.text(invoice.client_phone, margin + 14, by); }

  // INVOICE DETAILS (right panel)
  const rx = margin + panelWidth + panelGap + 14;
  let ry = y + 20;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  setText(COLOR.purple);
  doc.text("INVOICE DETAILS", rx, ry);
  ry += 16;
  const detailRows = [
    ["Due Date", invoice.due || "-"],
    ["Category", invoice.category ? invoice.category.charAt(0).toUpperCase() + invoice.category.slice(1) : "-"],
    ["Tax Type", invoice.tax_type === "CGST_SGST" ? "CGST + SGST" : invoice.tax_type === "IGST" ? "IGST" : "-"],
  ];
  detailRows.forEach(([label, value]) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    setText(COLOR.gray);
    doc.text(label, rx, ry);
    doc.setFont("helvetica", "bold");
    setText(COLOR.dark);
    doc.text(String(value), rx + 90, ry);
    ry += 13;
  });

  y += panelHeight + 30;

  // ---- Description / Amount table (purple header bar) ----
  const rowH = 26;
  setFill(COLOR.purple);
  doc.rect(margin, y, contentWidth, rowH, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  setText(COLOR.white);
  doc.text("DESCRIPTION", margin + 12, y + 17);
  doc.text("AMOUNT", pageWidth - margin - 12, y + 17, { align: "right" });
  y += rowH;

  const lineDescription = invoice.description && invoice.description.trim()
    ? invoice.description
    : (invoice.category ? `${invoice.category.charAt(0).toUpperCase()}${invoice.category.slice(1)} services` : "Services rendered");
  const wrappedDesc = doc.splitTextToSize(lineDescription, contentWidth - 160);
  const lineRowHeight = Math.max(26, wrappedDesc.length * 12 + 12);

  setDraw(COLOR.border);
  doc.line(margin, y + lineRowHeight, pageWidth - margin, y + lineRowHeight);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  setText(COLOR.dark);
  doc.text(wrappedDesc, margin + 12, y + 17);
  doc.text(money(invoice.amount), pageWidth - margin - 12, y + 17, { align: "right" });
  y += lineRowHeight + 14;

  // ---- Totals (right aligned) ----
  const totalsLabelX = pageWidth - margin - 180;
  const totalsValX = pageWidth - margin - 12;

  function totalsRow(label, value, bold = false) {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(9.5);
    setText(bold ? COLOR.dark : COLOR.gray);
    doc.text(label, totalsLabelX, y);
    doc.text(value, totalsValX, y, { align: "right" });
    y += 17;
  }

  totalsRow("Subtotal", money(invoice.amount));
  if (invoice.tax_type === "CGST_SGST") {
    totalsRow("CGST", money(invoice.cgst));
    totalsRow("SGST", money(invoice.sgst));
  } else if (invoice.tax_type === "IGST") {
    totalsRow("IGST", money(invoice.igst));
  }
  y += 8;

  // TOTAL DUE box (pink accent, matches site's gradient buttons)
  const totalBoxW = 200;
  const totalBoxH = 36;
  const totalBoxX = pageWidth - margin - totalBoxW;
  setFill(COLOR.pink);
  doc.roundedRect(totalBoxX, y, totalBoxW, totalBoxH, 6, 6, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  setText(COLOR.white);
  doc.text("TOTAL DUE", totalBoxX + 14, y + 23);
  doc.text(money(invoice.total_amount != null ? invoice.total_amount : invoice.amount), totalBoxX + totalBoxW - 14, y + 23, { align: "right" });
  y += totalBoxH + 40;

  // ---- Payment Methods ----
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  setText(COLOR.purple);
  doc.text("PAYMENT METHODS", margin, y);
  y += 16;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  setText(COLOR.dark);
  doc.text("BANK TRANSFER", margin, y);
  y += 14;

  const payLines = [
    ["Bank", BANK.bankName],
    ["Account Number", BANK.accountNumber],
    ["IFSC", BANK.ifsc],
    ["Branch", BANK.branch],
  ];
  doc.setFontSize(8.5);
  payLines.forEach(([label, value]) => {
    doc.setFont("helvetica", "normal");
    setText(COLOR.gray);
    doc.text(`${label}:`, margin, y);
    doc.setFont("helvetica", "bold");
    setText(COLOR.dark);
    doc.text(value, margin + 90, y);
    y += 13;
  });

  y += 10;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  setText(COLOR.grayLight);
  const noteLines = doc.splitTextToSize(
    "Payment is due upon receipt of this invoice unless otherwise agreed in writing. Thank you for your business.",
    contentWidth
  );
  doc.text(noteLines, margin, y);
  y += noteLines.length * 10 + 24;

  // ---- Signatures ----
  setDraw(COLOR.border);
  doc.setLineWidth(1);
  doc.line(margin, y, margin + 180, y);
  doc.line(pageWidth - margin - 180, y, pageWidth - margin, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  setText(COLOR.gray);
  doc.text("Authorized Signature", margin, y + 14);
  doc.text("Client Signature", pageWidth - margin - 180, y + 14);

  // ---- Save ----
  const fileName = `Invoice-${invoice.displayId || invoice.invoice_number || "draft"}.pdf`;
  doc.save(fileName);
}

export const downloadInvoicePDF = generateInvoicePDF;