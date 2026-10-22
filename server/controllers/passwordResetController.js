const { randomBytes } = require("node:crypto");
const PasswordResetToken = require("../models/PasswordResetToken");
const Session = require("../models/Session");
const User = require("../models/User");
const { hashToken } = require("../middleware/auth");
const { sendPasswordResetEmail } = require("../utils/passwordResetEmail");

const RESET_TTL_MS = 30 * 60 * 1000;
const GENERIC_MESSAGE = "If an account exists for that email, a password reset link will be sent shortly.";

function validEmail(email) {
  return typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function getResetBaseUrl(req) {
  const configuredOrigin = process.env.CLIENT_ORIGIN?.split(",")[0]?.trim();
  if (configuredOrigin) return configuredOrigin;
  if (process.env.NODE_ENV !== "production") return "http://localhost:5173";
  throw new Error("CLIENT_ORIGIN must be configured for password reset links.");
}

async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body || {};
    if (!validEmail(email)) {
      return res.status(400).json({ success: false, message: "Please enter a valid email address." });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail, isActive: true }).select("_id email");

    if (!user) return res.json({ success: true, message: GENERIC_MESSAGE });

    // Invalidate earlier links before creating a new one.
    await PasswordResetToken.deleteMany({ user: user._id });
    const rawToken = randomBytes(32).toString("base64url");
    const expiresAt = new Date(Date.now() + RESET_TTL_MS);
    await PasswordResetToken.create({
      user: user._id,
      tokenHash: hashToken(rawToken),
      expiresAt,
    });

    const resetUrl = `${getResetBaseUrl(req).replace(/\/$/, "")}/reset-password?token=${encodeURIComponent(rawToken)}`;

    try {
      const delivery = await sendPasswordResetEmail({ to: user.email, resetUrl });
      const payload = { success: true, message: GENERIC_MESSAGE };
      // Development-only convenience; never reveal reset tokens in production responses or logs.
      if (process.env.NODE_ENV !== "production" && !delivery.delivered) {
        payload.developmentResetUrl = resetUrl;
      }
      return res.json(payload);
    } catch (deliveryError) {
      await PasswordResetToken.deleteMany({ user: user._id });
      throw deliveryError;
    }
  } catch (error) {
    next(error);
  }
}

async function resetPassword(req, res, next) {
  try {
    const { token, password } = req.body || {};
    if (typeof token !== "string" || token.length < 20 || token.length > 200) {
      return res.status(400).json({ success: false, message: "This reset link is invalid or has expired. Please request a new one." });
    }
    if (typeof password !== "string" || password.length < 8 || password.length > 128) {
      return res.status(400).json({ success: false, message: "Password must be 8–128 characters long." });
    }

    // Atomically consume the token so concurrent requests cannot reuse it.
    const tokenRecord = await PasswordResetToken.findOneAndDelete({
      tokenHash: hashToken(token),
      expiresAt: { $gt: new Date() },
    }).select("+tokenHash");

    if (!tokenRecord) {
      return res.status(400).json({ success: false, message: "This reset link is invalid or has expired. Please request a new one." });
    }

    const user = await User.findOne({ _id: tokenRecord.user, isActive: true }).select("+passwordHash");
    if (!user) {
      return res.status(400).json({ success: false, message: "This reset link is invalid or has expired. Please request a new one." });
    }

    user.password = password;
    await user.save();

    // A password reset invalidates every active session for this account.
    await Promise.all([
      Session.deleteMany({ user: user._id }),
      PasswordResetToken.deleteMany({ user: user._id }),
    ]);

    return res.json({ success: true, message: "Password updated successfully. Please log in with your new password." });
  } catch (error) {
    next(error);
  }
}

module.exports = { forgotPassword, resetPassword };
