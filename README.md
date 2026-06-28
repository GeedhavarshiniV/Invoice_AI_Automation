# InvoiceAI — Agent Server

Three AI agents running locally via FastAPI, powered by Gemini.

## Agents

| Agent | Endpoint | What it does |
|---|---|---|
| OCR Extraction | `POST /api/extract` | Reads any invoice PDF/image, returns structured JSON |
| Rule Validation | `POST /api/validate` | Checks totals, dates, required fields |
| AI Validation | `POST /api/validate/ai` | Gemini detects anomalies, gives risk score |
| Full Pipeline | `POST /api/validate/full` | Upload once → extract + validate in one call |
| Chatbot | `POST /api/chat` | Multi-turn Q&A about invoices |

---

## Setup (5 minutes)

### 1. Make sure Python 3.11+ is installed
```bash
python --version
```

### 2. Create a virtual environment
```bash
python -m venv venv

# Mac/Linux:
source venv/bin/activate

# Windows:
venv\Scripts\activate
```

### 3. Install dependencies
```bash
pip install -r requirements.txt
```

### 4. Add your Gemini API key
Open `.env` and replace the placeholder:
```
GEMINI_API_KEY=AIza...your_actual_key_here
```
Get a free key at: https://aistudio.google.com/app/apikey

### 5. Run the server
```bash
uvicorn main:app --reload --port 8000
```

### 6. Open the interactive docs
Go to: **http://localhost:8000/docs**

You can test all endpoints directly in the browser — upload files, send messages, everything.

---

## API Usage Examples

### Extract an invoice
```bash
curl -X POST http://localhost:8000/api/extract \
  -F "file=@invoice.pdf"
```

### Validate extracted data
```bash
curl -X POST http://localhost:8000/api/validate \
  -H "Content-Type: application/json" \
  -d '{"vendor_name": "Acme Corp", "total_amount": 1200, "invoice_date": "2025-06-01"}'
```

### Full pipeline (extract + validate in one shot)
```bash
curl -X POST http://localhost:8000/api/validate/full \
  -F "file=@invoice.jpg"
```

### Chat with the assistant
```bash
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Is this invoice overdue?",
    "session_id": "my-session-1",
    "invoice_context": {
      "vendor_name": "Acme Corp",
      "total_amount": 1200,
      "due_date": "2025-05-01"
    }
  }'
```

### Continue the conversation (same session_id = memory)
```bash
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Draft a payment reminder email for them",
    "session_id": "my-session-1"
  }'
```

---

## Connecting to your React frontend

Replace mock fetch calls in the frontend with:

```js
// Extract invoice
const formData = new FormData();
formData.append('file', fileInput.files[0]);
const res = await fetch('http://localhost:8000/api/extract', {
  method: 'POST',
  body: formData,
});
const data = await res.json();

// Chat
const res = await fetch('http://localhost:8000/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message: userInput, session_id: sessionId }),
});
```

---

## Project structure

```
invoice-agents/
├── main.py                  ← FastAPI app, CORS, router
├── requirements.txt
├── .env                     ← Your Gemini API key goes here
├── core/
│   └── gemini.py            ← Gemini client setup
├── agents/
│   ├── ocr_agent.py         ← OCR extraction agent
│   ├── validation_agent.py  ← Rule + AI validation agent
│   └── chatbot_agent.py     ← Conversational chatbot agent
└── routes/
    └── agents.py            ← All API endpoints
```
