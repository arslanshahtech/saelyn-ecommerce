const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      credentials: "include",
      headers: {
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...options.headers,
      },
    });
  } catch {
    throw new Error("SAELYN API se connection nahi ho saka. Backend aur MongoDB check karein.");
  }

  let payload;
  try { payload = await response.json(); }
  catch { throw new Error("API ne valid JSON response return nahi kiya."); }

  if (!response.ok || payload.success === false) {
    throw new Error(payload.message || `Request failed (${response.status})`);
  }
  return payload;
}

export function createOrder(details) {
  return request("/orders", { method: "POST", body: JSON.stringify(details) });
}

export function getMyOrders() {
  return request("/orders/mine");
}
