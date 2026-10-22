const { randomBytes } = require("node:crypto");
const Session = require("../models/Session");
const User = require("../models/User");
const { COOKIE_NAME, hashToken, readCookie } = require("../middleware/auth");

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function cookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Lax",
    path: "/",
    maxAge: SESSION_TTL_MS,
  };
}

function clearCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Lax",
    path: "/",
  };
}

function publicUser(user) {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    phone: user.phone || "",
    role: user.role,
    addresses: user.addresses || [],
    createdAt: user.createdAt,
  };
}

function validateEmail(email) {
  return typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

async function createSession(user, res) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await Session.create({ user: user._id, tokenHash: hashToken(token), expiresAt });
  res.cookie(COOKIE_NAME, token, cookieOptions());
}

async function register(req, res, next) {
  try {
    const { name, email, password, phone = "" } = req.body || {};
    if (typeof name !== "string" || name.trim().length < 2 || name.trim().length > 100) {
      return res.status(400).json({ success: false, message: "Please enter your full name (2–100 characters)." });
    }
    if (!validateEmail(email)) {
      return res.status(400).json({ success: false, message: "Please enter a valid email address." });
    }
    if (typeof password !== "string" || password.length < 8 || password.length > 128) {
      return res.status(400).json({ success: false, message: "Password must be 8–128 characters long." });
    }
    if (typeof phone !== "string" || phone.trim().length > 30) {
      return res.status(400).json({ success: false, message: "Please enter a valid phone number." });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail }).select("_id");
    if (existingUser) {
      return res.status(409).json({ success: false, message: "An account with this email already exists. Please log in." });
    }

    const user = new User({
      name: name.trim(),
      email: normalizedEmail,
      phone: phone.trim(),
      password,
      role: "user",
    });
    await user.save();
    await createSession(user, res);

    return res.status(201).json({ success: true, message: "Your SAELYN account has been created.", user: publicUser(user) });
  } catch (error) {
    if (error && error.code === 11000) {
      return res.status(409).json({ success: false, message: "An account with this email already exists. Please log in." });
    }
    next(error);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body || {};
    if (!validateEmail(email) || typeof password !== "string" || !password || password.length > 128) {
      return res.status(400).json({ success: false, message: "Enter a valid email and password." });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase(), isActive: true }).select("+passwordHash");
    const passwordMatches = user ? await user.comparePassword(password) : false;
    if (!user || !passwordMatches) {
      return res.status(401).json({ success: false, message: "Email or password is incorrect." });
    }

    await createSession(user, res);
    return res.json({ success: true, message: "You are now logged in.", user: publicUser(user) });
  } catch (error) {
    next(error);
  }
}

async function logout(req, res, next) {
  try {
    const token = readCookie(req, COOKIE_NAME);
    if (token) await Session.deleteOne({ tokenHash: hashToken(token) });
    res.clearCookie(COOKIE_NAME, clearCookieOptions());
    return res.json({ success: true, message: "You have been logged out." });
  } catch (error) {
    next(error);
  }
}

function me(req, res) {
  return res.json({ success: true, user: publicUser(req.user) });
}

module.exports = { register, login, logout, me };
