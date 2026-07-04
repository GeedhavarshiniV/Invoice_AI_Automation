import jsPDF from "jspdf";

// ---- Your business details ----
const SELLER = {
  name: "Ledgerly AI Solutions",
  address: "Chennai, Tamil Nadu, India",
  phone: "+91 93420 47341",
  email: "support@ledgerly.ai",
  gstin: "—",
};

const BANK = {
  bankName: "HDFC Bank",
  accountNumber: "50100123456789",
  ifsc: "HDFC0001234",
  branch: "Chennai Main Branch",
};

const JURISDICTION = "CHENNAI";

function money(n) {
  return (n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ---- Number to words (Indian numbering system) ----
function numberToWords(num) {
  const a = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
    "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  function inWords(n) {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 ? " " + a[n % 10] : "");
    if (n < 1000) return a[Math.floor(n / 100)] + " Hundred" + (n % 100 ? " " + inWords(n % 100) : "");
    return "";
  }

  num = Math.floor(num);
  if (num === 0) return "Zero";

  let str = "";
  const crore = Math.floor(num / 10000000); num %= 10000000;
  const lakh = Math.floor(num / 100000); num %= 100000;
  const thousand = Math.floor(num / 1000); num %= 1000;
  const rest = num;

  if (crore) str += inWords(crore) + " Crore ";
  if (lakh) str += inWords(lakh) + " Lakh ";
  if (thousand) str += inWords(thousand) + " Thousand ";
  if (rest) str += inWords(rest);

  return str.trim();
}

export function generateInvoicePDF(invoice) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = 595;
  const margin = 36;
  const contentWidth = pageWidth - margin * 2;
  let y = 40;

  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.75);

  // ---- Title ----
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(0, 0, 0);
  doc.text("TAX INVOICE", pageWidth / 2, y, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("(Original for Recipient)", pageWidth - margin, y - 4, { align: "right" });
  y += 14;

  // ============ SELLER / INVOICE META BOX ============
  const boxTop1 = y;
  const box1Height = 96;
  const sellerColWidth = contentWidth * 0.55;

  doc.rect(margin, boxTop1, contentWidth, box1Height);
  doc.line(margin + sellerColWidth, boxTop1, margin + sellerColWidth, boxTop1 + box1Height);

  // Seller info (left)
  let sy = boxTop1 + 14;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(SELLER.name, margin + 8, sy);
  sy += 13;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.text(SELLER.address, margin + 8, sy);
  sy += 12;
  doc.text(`GSTIN: ${SELLER.gstin}`, margin + 8, sy);
  sy += 12;
  doc.text(`Email: ${SELLER.email}`, margin + 8, sy);
  sy += 12;
  doc.text(`Ph: ${SELLER.phone}`, margin + 8, sy);

  // Invoice meta (right)
  const metaX = margin + sellerColWidth + 8;
  const metaValX = margin + sellerColWidth + 110;
  let my = boxTop1 + 14;
  const metaRows = [
    ["Invoice No.", invoice.displayId || invoice.invoice_number || "-"],
    ["Dated", invoice.issued || "-"],
    ["Due Date", invoice.due || "-"],
    ["Status", (invoice.status || "PENDING").toUpperCase()],
    ["Mode of Payment", "Bank Transfer"],
  ];
  doc.setFontSize(8.5);
  metaRows.forEach(([label, value]) => {
    doc.setFont("helvetica", "normal");
    doc.text(label, metaX, my);
    doc.setFont("helvetica", "bold");
    doc.text(String(value), metaValX, my);
    my += 15.5;
  });

  y = boxTop1 + box1Height;

  // ============ BUYER BOX ============
  const box2Height = 70;
  doc.rect(margin, y, contentWidth, box2Height);
  let by = y + 14;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("Buyer (Bill To):", margin + 8, by);
  by += 14;
  doc.setFontSize(9.5);
  doc.text(invoice.client || "-", margin + 8, by);
  by += 13;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  if (invoice.client_address) { doc.text(invoice.client_address, margin + 8, by); by += 12; }
  const contactBits = [];
  if (invoice.email) contactBits.push(invoice.email);
  if (invoice.client_phone) contactBits.push(`Ph: ${invoice.client_phone}`);
  if (contactBits.length) doc.text(contactBits.join("   |   "), margin + 8, by);

  y += box2Height;

  // ============ ITEMS TABLE ============
  const colX = {
    sl: margin,
    desc: margin + 30,
    hsn: margin + 260,
    qty: margin + 330,
    rate: margin + 385,
    per: margin + 450,
    amount: margin + contentWidth,
  };
  const headerHeight = 20;
  doc.rect(margin, y, contentWidth, headerHeight);
  [colX.desc, colX.hsn, colX.qty, colX.rate, colX.per].forEach((x) => doc.line(x, y, x, y + headerHeight));

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("Sl", colX.sl + 10, y + 13, { align: "center" });
  doc.text("Description of Goods / Services", colX.desc + 6, y + 13);
  doc.text("HSN/SAC", colX.hsn + 6, y + 13);
  doc.text("Qty", colX.qty + 15, y + 13, { align: "center" });
  doc.text("Rate", colX.rate + 25, y + 13, { align: "center" });
  doc.text("Amount", colX.amount - 6, y + 13, { align: "right" });

  y += headerHeight;

  const lineDescription = invoice.description && invoice.description.trim()
    ? invoice.description
    : (invoice.category ? `${invoice.category.charAt(0).toUpperCase()}${invoice.category.slice(1)} services` : "Services rendered");
  const wrappedDesc = doc.splitTextToSize(lineDescription, 220);
  const rowHeight = Math.max(24, wrappedDesc.length * 11 + 12);

  doc.rect(margin, y, contentWidth, rowHeight);
  [colX.desc, colX.hsn, colX.qty, colX.rate, colX.per].forEach((x) => doc.line(x, y, x, y + rowHeight));

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.text("1", colX.sl + 10, y + 14, { align: "center" });
  doc.text(wrappedDesc, colX.desc + 6, y + 14);
  doc.text("—", colX.hsn + 6, y + 14);
  doc.text("1", colX.qty + 15, y + 14, { align: "center" });
  doc.text(money(invoice.amount), colX.rate + 25, y + 14, { align: "center" });
  doc.text(money(invoice.amount), colX.amount - 6, y + 14, { align: "right" });

  y += rowHeight;

  // Tax rows inside the same table block
  const taxRows = [];
  if (invoice.tax_type === "CGST_SGST") {
    taxRows.push(["CGST", invoice.cgst]);
    taxRows.push(["SGST", invoice.sgst]);
  } else if (invoice.tax_type === "IGST") {
    taxRows.push(["IGST", invoice.igst]);
  }
  taxRows.push(["TOTAL", invoice.total_amount != null ? invoice.total_amount : invoice.amount]);

  const taxRowHeight = 16;
  taxRows.forEach(([label, value]) => {
    doc.rect(margin, y, contentWidth, taxRowHeight);
    const isTotal = label === "TOTAL";
    doc.setFont("helvetica", isTotal ? "bold" : "normal");
    doc.setFontSize(8.5);
    doc.text(label, colX.per + 6, y + 11.5);
    doc.text(money(value), colX.amount - 6, y + 11.5, { align: "right" });
    y += taxRowHeight;
  });

  // ---- Amount chargeable in words ----
  const wordsBoxHeight = 30;
  doc.rect(margin, y, contentWidth, wordsBoxHeight);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("Amount Chargeable (in words)", margin + 8, y + 12);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  const totalForWords = invoice.total_amount != null ? invoice.total_amount : invoice.amount;
  const wordsLine = doc.splitTextToSize(
    `INR ${numberToWords(totalForWords)} Only`,
    contentWidth - 16
  );
  doc.text(wordsLine, margin + 8, y + 24);
  y += wordsBoxHeight;

  // ============ HSN / TAX SUMMARY TABLE ============
  const taxType = invoice.tax_type;
  const sumHeaderHeight = 16;
  const sumColX = {
    hsn: margin,
    taxable: margin + 100,
    rateCol: margin + 220,
    amtCol: margin + 280,
    rateCol2: margin + 350,
    amtCol2: margin + 410,
    total: margin + contentWidth,
  };

  doc.rect(margin, y, contentWidth, sumHeaderHeight);
  [sumColX.taxable, sumColX.rateCol, sumColX.amtCol, sumColX.rateCol2, sumColX.amtCol2].forEach((x) =>
    doc.line(x, y, x, y + sumHeaderHeight)
  );
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.text("HSN/SAC", sumColX.hsn + 6, y + 11);
  doc.text("Taxable Value", sumColX.taxable + 6, y + 11);
  if (taxType === "CGST_SGST") {
    doc.text("CGST Rate", sumColX.rateCol + 6, y + 11);
    doc.text("CGST Amt", sumColX.amtCol + 6, y + 11);
    doc.text("SGST Rate", sumColX.rateCol2 + 6, y + 11);
    doc.text("SGST Amt", sumColX.amtCol2 + 6, y + 11);
  } else {
    doc.text("IGST Rate", sumColX.rateCol + 6, y + 11);
    doc.text("IGST Amt", sumColX.amtCol + 6, y + 11);
  }
  y += sumHeaderHeight;

  const sumRowHeight = 16;
  doc.rect(margin, y, contentWidth, sumRowHeight);
  [sumColX.taxable, sumColX.rateCol, sumColX.amtCol, sumColX.rateCol2, sumColX.amtCol2].forEach((x) =>
    doc.line(x, y, x, y + sumRowHeight)
  );
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("—", sumColX.hsn + 6, y + 11);
  doc.text(money(invoice.amount), sumColX.taxable + 6, y + 11);
  if (taxType === "CGST_SGST") {
    const rate = invoice.amount ? ((invoice.cgst / invoice.amount) * 100).toFixed(1) : "0.0";
    doc.text(`${rate}%`, sumColX.rateCol + 6, y + 11);
    doc.text(money(invoice.cgst), sumColX.amtCol + 6, y + 11);
    doc.text(`${rate}%`, sumColX.rateCol2 + 6, y + 11);
    doc.text(money(invoice.sgst), sumColX.amtCol2 + 6, y + 11);
  } else if (taxType === "IGST") {
    const rate = invoice.amount ? ((invoice.igst / invoice.amount) * 100).toFixed(1) : "0.0";
    doc.text(`${rate}%`, sumColX.rateCol + 6, y + 11);
    doc.text(money(invoice.igst), sumColX.amtCol + 6, y + 11);
  }
  y += sumRowHeight;

  // ---- Tax amount in words ----
  const taxWordsHeight = 26;
  doc.rect(margin, y, contentWidth, taxWordsHeight);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("Tax Amount (in words):", margin + 8, y + 12);
  doc.setFont("helvetica", "bold");
  const totalGst = invoice.total_gst || 0;
  const taxWordsLine = doc.splitTextToSize(`INR ${numberToWords(totalGst)} Only`, contentWidth - 140);
  doc.text(taxWordsLine, margin + 150, y + 12);
  y += taxWordsHeight;

  // ============ GSTIN/PAN + BANK DETAILS ============
  const bankBoxHeight = 78;
  const leftColWidth = contentWidth * 0.42;
  doc.rect(margin, y, contentWidth, bankBoxHeight);
  doc.line(margin + leftColWidth, y, margin + leftColWidth, y + bankBoxHeight);

  let gy = y + 14;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.text(`GSTIN: ${SELLER.gstin}`, margin + 8, gy);
  gy += 14;
  doc.text(`PAN: —`, margin + 8, gy);

  let bky = y + 14;
  const bankX = margin + leftColWidth + 8;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text("Company's Bank Details", bankX, bky);
  bky += 13;
  doc.setFont("helvetica", "normal");
  const bankLines = [
    ["Bank Name", BANK.bankName],
    ["A/c No.", BANK.accountNumber],
    ["IFSC Code", BANK.ifsc],
    ["Branch", BANK.branch],
  ];
  bankLines.forEach(([label, value]) => {
    doc.text(`${label}: ${value}`, bankX, bky);
    bky += 13;
  });

  y += bankBoxHeight;

  // ============ DECLARATION + SIGNATURE ============
  const declBoxHeight = 90;
  doc.rect(margin, y, contentWidth, declBoxHeight);
  doc.line(margin + leftColWidth, y, margin + leftColWidth, y + declBoxHeight);

  let dy = y + 14;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("Declaration", margin + 8, dy);
  dy += 12;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  const declText = doc.splitTextToSize(
    "We declare that this invoice shows the actual price of the goods/services described and that all particulars are true and correct.",
    leftColWidth - 16
  );
  doc.text(declText, margin + 8, dy);

  const sigX = margin + leftColWidth + 8;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text(`For ${SELLER.name}`, sigX, y + 14);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.text("Authorized Signatory", sigX, y + declBoxHeight - 10);

  y += declBoxHeight;

  // ---- Jurisdiction footer ----
  y += 16;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(`SUBJECT TO ${JURISDICTION} JURISDICTION`, pageWidth / 2, y, { align: "center" });

  // ---- Save ----
  const fileName = `Invoice-${invoice.displayId || invoice.invoice_number || "draft"}.pdf`;
  doc.save(fileName);
}

export const downloadInvoicePDF = generateInvoicePDF;







