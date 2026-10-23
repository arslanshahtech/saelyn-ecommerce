import { API_BASE_URL } from "./config.js";

async function authRequest(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}/auth${path}`, {
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
  try {
    payload = await response.json();
  } catch {
    throw new Error("API ne valid response return nahi kiya.");
  }

  if (!response.ok || payload.success === false) {
    throw new Error(payload.message || `Request failed (${response.status})`);
  }
  return payload;
}

export async function registerAccount(details) {
  return authRequest("/register", { method: "POST", body: JSON.stringify(details) });
}

export async function loginAccount(details) {
  return authRequest("/login", { method: "POST", body: JSON.stringify(details) });
}

export async function logoutAccount() {
  return authRequest("/logout", { method: "POST" });
}

export async function getCurrentUser() {
  return authRequest("/me");
}

export async function requestPasswordReset(email) {
  return authRequest("/forgot-password", { method: "POST", body: JSON.stringify({ email }) });
}

export async function submitNewPassword(token, password) {
  return authRequest("/reset-password", { method: "POST", body: JSON.stringify({ token, password }) });
}
