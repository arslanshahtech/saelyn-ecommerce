const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export function normalizeProduct(product) {
  if (!product) return product;
  const id = product._id || product.id;
  const numericPrice = Number(product.price);
  return {
    ...product,
    id,
    _id: product._id || product.id,
    price: Number.isFinite(numericPrice) ? `$${numericPrice}` : product.price,
    numericPrice: Number.isFinite(numericPrice) ? numericPrice : Number(String(product.price).replace(/[^0-9.]/g, "")),
    colors: product.colors || [],
    sizes: product.sizes || [],
    details: product.details || [],
    material: product.material || "",
    description: product.description || "",
    image: product.image || "",
  };
}

async function request(path = "", options = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...options.headers,
      },
    });
  } catch {
    throw new Error("SAELYN API se connection nahi ho saka. Check karein ke backend aur MongoDB running hain.");
  }

  let payload;
  try {
    payload = await response.json();
  } catch {
    throw new Error("API ne valid JSON response return nahi kiya.");
  }

  if (!response.ok || payload.success === false) {
    throw new Error(payload.message || `Request failed (${response.status})`);
  }
  return payload;
}

export async function getProducts(params = {}) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    if (Array.isArray(value)) value.forEach((item) => searchParams.append(key, item));
    else searchParams.set(key, String(value));
  });
  const query = searchParams.toString();
  const payload = await request(`/products${query ? `?${query}` : ""}`);
  return (payload.products || []).map(normalizeProduct);
}

export async function getProductById(id) {
  const payload = await request(`/products/${encodeURIComponent(id)}`);
  return normalizeProduct(payload.product);
}
