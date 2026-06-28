// Product-usage FAQ shown inside the dashboard (Help section), behind login.
// Distinct from src/data/faqData.js, which is the PUBLIC marketing FAQ used
// for SEO/AEO/GEO on the landing page. This one is for "how do I do X"
// questions from users who already have an account — it is intentionally
// NOT exposed via JSON-LD schema, since search engines/AI crawlers never
// reach this page anyway (it's noIndex + behind authentication).

const helpFaqData = [
  {
    question: "How do I create a new invoice?",
    answer:
      "Go to Invoices from the sidebar and click \"+ New Invoice.\" Fill in the client, amount, and due date — Ledgerly will generate and send it automatically based on your notification settings.",
  },
  {
    question: "How do I add or edit a client?",
    answer:
      "Open Clients from the sidebar. Click \"+ Add Client\" to create a new one, or click any existing client's row to edit their details, payment history, and risk notes.",
  },
  {
    question: "How does the AI Agent decide when to approve an extension?",
    answer:
      "The AI Agent follows the rules set in Settings (e.g. maximum extension length, eligible clients). Requests within those limits are approved automatically; anything outside them is sent to you for manual review under Extensions.",
  },
  {
    question: "Where can I see why an invoice was flagged as fraud risk?",
    answer:
      "Open Fraud Check from the sidebar. Each flagged invoice shows the specific signals that triggered the alert — for example, duplicate invoice numbers or an unusual payment pattern from that client.",
  },
  {
    question: "Can I change how often payment reminders are sent?",
    answer:
      "Yes. Go to Settings to adjust the reminder schedule, or open Messages to edit the reminder templates and timing for a specific client or invoice.",
  },
  {
    question: "How do I export my reports?",
    answer:
      "Open Reports from the sidebar, choose the date range and metrics you want, then use the export option to download the data for your records or accountant.",
  },
];

export default helpFaqData;
