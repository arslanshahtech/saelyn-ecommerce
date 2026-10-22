const WINDOW_MS = 15 * 60 * 1000;
const MAX_REQUESTS = 5;
const requestsByKey = new Map();

module.exports = function passwordResetRateLimit(req, res, next) {
  const key = String(req.ip || req.socket?.remoteAddress || "unknown");
  const now = Date.now();
  const recent = (requestsByKey.get(key) || []).filter((timestamp) => now - timestamp < WINDOW_MS);

  if (recent.length >= MAX_REQUESTS) {
    res.set("Retry-After", String(Math.ceil((WINDOW_MS - (now - recent[0])) / 1000)));
    return res.status(429).json({
      success: false,
      message: "Too many password reset attempts. Please try again in a few minutes.",
    });
  }

  recent.push(now);
  requestsByKey.set(key, recent);

  // Bound memory usage if many distinct clients hit the endpoint.
  if (requestsByKey.size > 10000) {
    for (const [storedKey, timestamps] of requestsByKey) {
      if (!timestamps.length || now - timestamps[timestamps.length - 1] >= WINDOW_MS) {
        requestsByKey.delete(storedKey);
      }
    }
  }
  next();
};
