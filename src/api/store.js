import { API_BASE_URL } from "./config.js";

export async function getPublicStoreSettings() {
  try {
    const response = await fetch(`${API_BASE_URL}/store/settings`, { headers: { Accept: "application/json" } });
    const payload = await response.json();
    if (!response.ok || !payload?.success) return null;
    return payload.settings || null;
  } catch {
    return null;
  }
}
