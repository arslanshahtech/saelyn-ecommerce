const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

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
