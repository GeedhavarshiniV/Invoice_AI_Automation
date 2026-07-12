// Central FAQ content for Ledgerly.
// Used by:
//  1. <FAQSection /> — renders the visible accordion on the landing page
//  2. JSON-LD FAQPage schema — gives search engines & AI answer engines (AEO/GEO)
//     a machine-readable version of the exact same content.
// Keeping this in one file means the visible text and the structured data
// can never drift out of sync.

const faqData = [
  {
    question: "What is Ledgerly and how does AI invoice automation work?",
    answer:
      "Ledgerly is an AI-powered invoice automation platform that creates, sends, tracks, and reconciles invoices automatically. Its AI agent monitors due dates, follows up with clients, negotiates short payment extensions, flags fraud risk, and escalates disputes to a human only when needed — cutting the manual work out of accounts receivable.",
  },
  {
    question: "How does the AI Agent handle late payments and disputes?",
    answer:
      "When an invoice approaches or passes its due date, the AI Agent automatically sends reminders, responds to client extension requests within set policy limits, and resolves common disputes such as partial refunds. Anything outside its confidence threshold is escalated to an admin with full context, so a human only steps in when it truly matters.",
  },
  {
    question: "Can Ledgerly detect fraudulent or suspicious invoices?",
    answer:
      "Yes. The built-in Fraud Detector analyzes invoice patterns, client payment history, and behavioral signals to flag anomalies — such as duplicate invoices, unusual amounts, or accounts with a history of late or disputed payments — before they become a financial risk.",
  },
  {
    question: "Does Ledgerly send automatic payment reminders?",
    answer:
      "Yes. Deadline Messages automatically notifies clients before and after due dates using customizable schedules and templates, reducing the number of invoices that slip into overdue status.",
  },
  {
    question: "Is my financial data secure with Ledgerly?",
    answer:
      "Ledgerly uses bank-grade encryption for every transaction and access point, so client, invoice, and payment data stays protected both in transit and at rest.",
  },
  {
    question: "Can I track invoice and payment status in real time?",
    answer:
      "Yes. The Invoice Tracker gives a real-time view of every invoice's status — paid, pending, overdue, or disputed — along with revenue trends and risk alerts on a single dashboard.",
  },
  {
    question: "Who is Ledgerly built for?",
    answer:
      "Ledgerly is built for freelancers, agencies, and small-to-mid-sized businesses that issue recurring invoices and want to reduce the time spent chasing payments, handling disputes, and reconciling accounts manually.",
  },
  {
    question: "Do I need technical or accounting knowledge to use Ledgerly?",
    answer:
      "No. Ledgerly is designed with a simple dashboard and guided workflows so business owners and finance teams can manage invoicing, clients, and reports without specialized accounting or technical expertise.",
  },
];

export default faqData;
