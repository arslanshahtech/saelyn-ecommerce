const { createHash } = require("node:crypto");
const Session = require("../models/Session");
const User = require("../models/User");

const COOKIE_NAME = "saelyn_session";

function hashToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

function readCookie(req, name) {
  const header = req.headers.cookie || "";
  for (const part of header.split(";")) {
    const separator = part.indexOf("=");
    if (separator < 0) continue;
    const key = part.slice(0, separator).trim();
    if (key === name) {
      try {
        return decodeURIComponent(part.slice(separator + 1).trim());
      } catch {
        return null;
      }
    }
  }
  return null;
}

async function requireAuth(req, res, next) {
  try {
    const token = readCookie(req, COOKIE_NAME);
    if (!token) {
      return res.status(401).json({ success: false, message: "Please log in to continue." });
    }

    const session = await Session.findOne({
      tokenHash: hashToken(token),
      expiresAt: { $gt: new Date() },
    });

    if (!session) {
      return res.status(401).json({ success: false, message: "Your session has expired. Please log in again." });
    }

    const user = await User.findOne({ _id: session.user, isActive: true });
    if (!user) {
      await Session.deleteOne({ _id: session._id });
      return res.status(401).json({ success: false, message: "This account is unavailable." });
    }

    req.user = user;
    req.sessionId = session._id;
    next();
  } catch (error) {
    next(error);
  }
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ success: false, message: "Administrator access is required." });
  }
  next();
}

module.exports = { COOKIE_NAME, hashToken, readCookie, requireAuth, requireAdmin };
