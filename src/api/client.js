const BASE_URL = "http://127.0.0.1:8000";

export function saveToken(token) { localStorage.setItem("ledgerly_token", token); }
export function getToken() { return localStorage.getItem("ledgerly_token"); }
export function clearToken() { localStorage.removeItem("ledgerly_token"); }

async function request(path, options = {}) {
  const token = getToken();
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (token) headers["Authorization"] = "Bearer " + token;
  const response = await fetch(BASE_URL + path, { ...options, headers });
  let data = null;
  const text = await response.text();
  if (text) { try { data = JSON.parse(text); } catch { data = text; } }
  if (!response.ok) {
    const message = (data && data.detail) || "Request failed with status " + response.status;
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }
  return data;
}

export const api = {
  login: (email, password) => request("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  register: (name, email, password) => request("/auth/register", { method: "POST", body: JSON.stringify({ name, email, password }) }),
  getClients: () => request("/clients/"),
  getClient: (id) => request("/clients/" + id),
  createClient: (client) => request("/clients/", { method: "POST", body: JSON.stringify(client) }),
  deleteClient: (id) => request("/clients/" + id, { method: "DELETE" }),
  getInvoices: () => request("/invoices/"),
  getInvoice: (id) => request("/invoices/" + id),
  createInvoice: (invoice) => request("/invoices/", { method: "POST", body: JSON.stringify(invoice) }),
  updateInvoiceStatus: (id, status) => request("/invoices/" + id + "/status", { method: "PATCH", body: JSON.stringify({ status }) }),
  deleteInvoice: (id) => request("/invoices/" + id, { method: "DELETE" }),
  getExtensions: () => request("/extensions/"),
  createExtension: (ext) => request("/extensions/", { method: "POST", body: JSON.stringify(ext) }),
  getSummary: () => request("/reports/summary"),
  getTopClients: () => request("/reports/top-clients"),
  getMonthlyReport: () => request("/reports/monthly"),
};