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

export const getSavedCart = () => request("/cart");
export const syncSavedCart = (items) => request("/cart/sync", { method: "POST", body: JSON.stringify({ items }) });
export const saveCart = (items) => request("/cart", { method: "PUT", body: JSON.stringify({ items }) });

export const getSavedWishlist = () => request("/wishlist");
export const syncSavedWishlist = (items) => request("/wishlist/sync", { method: "POST", body: JSON.stringify({ items }) });
export const saveWishlist = (items) => request("/wishlist", { method: "PUT", body: JSON.stringify({ items }) });

export function toCartPayload(items) {
  return items.map((item) => ({
    productId: item.id || item._id,
    quantity: item.quantity,
    selectedSize: item.selectedSize || "",
    selectedColor: item.selectedColor || "",
  }));
}

export function toWishlistPayload(items) {
  return items.map((item) => ({ productId: item.id || item._id }));
}
