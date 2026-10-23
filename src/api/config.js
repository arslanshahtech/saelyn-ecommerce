// Keep every frontend API call on one configured base URL.
// Local development uses the stable localhost backend; production uses same-origin /api.
export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
