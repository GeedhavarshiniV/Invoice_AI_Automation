import requests
import os
from dotenv import load_dotenv
load_dotenv()

N8N_WEBHOOK_URL = os.getenv("N8N_WEBHOOK_URL", "http://localhost:5678/webhook")

def send_notification(event_type: str, data: dict):
    try:
        response = requests.post(N8N_WEBHOOK_URL, json={"event": event_type, "data": data}, timeout=5)
        return response.status_code == 200
    except Exception as e:
        print(f"Notification failed: {e}")
        return False

def notify_extension_approved(client_name, invoice_number, new_due_date, email):
    send_notification("extension_approved", {"client_name": client_name, "invoice_number": invoice_number, "new_due_date": new_due_date, "email": email})

def notify_overdue(client_name, invoice_number, amount, email):
    send_notification("invoice_overdue", {"client_name": client_name, "invoice_number": invoice_number, "amount": amount, "email": email})
