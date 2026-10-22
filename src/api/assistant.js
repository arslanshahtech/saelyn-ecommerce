const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export async function sendAssistantMessage(message, history = []) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}/assistant/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, history: history.slice(-8) }),
    });
  } catch {
    throw new Error("Assistant se connection nahi ho saka. Backend running hai ya nahi check karein.");
  }

  let payload;
  try {
    payload = await response.json();
  } catch {
    throw new Error("Assistant ne valid response return nahi kiya.");
  }

  if (!response.ok || payload.success === false) {
    throw new Error(payload.message || "Assistant abhi response nahi de saka.");
  }

  return payload;
}
