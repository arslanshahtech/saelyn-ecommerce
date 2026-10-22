const WINDOW_MS = 15 * 60 * 1000;
const MAX_REQUESTS = 12;
const requestsByIp = new Map();

module.exports = function assistantRateLimit(req, res, next) {
  const key = String(req.ip || req.socket?.remoteAddress || "unknown");
  const now = Date.now();
  const recent = (requestsByIp.get(key) || []).filter((timestamp) => now - timestamp < WINDOW_MS);

  if (recent.length >= MAX_REQUESTS) {
    const retryAfter = Math.max(1, Math.ceil((WINDOW_MS - (now - recent[0])) / 1000));
    res.set("Retry-After", String(retryAfter));
    return res.status(429).json({
      success: false,
      message: "You have sent several requests. Please wait a few minutes and try again.",
    });
  }

  recent.push(now);
  requestsByIp.set(key, recent);
  if (requestsByIp.size > 10000) {
    for (const [storedKey, timestamps] of requestsByIp) {
      if (!timestamps.length || now - timestamps[timestamps.length - 1] >= WINDOW_MS) requestsByIp.delete(storedKey);
    }
  }
  return next();
};
