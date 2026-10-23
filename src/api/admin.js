import { API_BASE_URL } from "./config.js";

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}/admin${path}`, {
      ...options,
      credentials: "include",
      headers: { Accept: "application/json", ...(options.body ? { "Content-Type": "application/json" } : {}), ...options.headers },
    });
  } catch {
    throw new Error("SAELYN API se connection nahi ho saka. Backend check karein.");
  }
  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload?.success) throw new Error(payload?.message || `Request failed (${response.status}).`);
  return payload;
}
const queryString = (params = {}) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => { if (value !== "" && value !== undefined && value !== null) query.set(key, value); });
  const text = query.toString();
  return text ? `?${text}` : "";
};
export async function getAdminOverview() { return (await request("/overview")).overview; }
export async function getAdminProducts(params) { return (await request(`/products${queryString(params)}`)).products; }
export async function createAdminProduct(data) { return request("/products", { method: "POST", body: JSON.stringify(data) }); }
export async function updateAdminProduct(id, data) { return request(`/products/${encodeURIComponent(id)}`, { method: "PUT", body: JSON.stringify(data) }); }
export async function deleteAdminProduct(id) { return request(`/products/${encodeURIComponent(id)}`, { method: "DELETE" }); }
export async function getAdminOrders(params) { return (await request(`/orders${queryString(params)}`)).orders; }
export async function updateAdminOrderStatus(id, orderStatus) { return request(`/orders/${encodeURIComponent(id)}/status`, { method: "PATCH", body: JSON.stringify({ orderStatus }) }); }
export async function getAdminCustomers(params) { return (await request(`/customers${queryString(params)}`)).customers; }
export async function updateAdminCustomerStatus(id, isActive) { return request(`/customers/${encodeURIComponent(id)}/status`, { method: "PATCH", body: JSON.stringify({ isActive }) }); }
export async function getStoreSettings() { return (await request("/settings")).settings; }
export async function saveStoreSettings(data) { return request("/settings", { method: "PUT", body: JSON.stringify(data) }); }
