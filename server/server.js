const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
require("dotenv").config();

const connectDB = require("./config/db");
const productRoutes = require("./routes/productRoutes");
const authRoutes = require("./routes/authRoutes");
const cartRoutes = require("./routes/cartRoutes");
const wishlistRoutes = require("./routes/wishlistRoutes");
const orderRoutes = require("./routes/orderRoutes");
const adminRoutes = require("./routes/adminRoutes");
const storeRoutes = require("./routes/storeRoutes");
const assistantRoutes = require("./routes/assistantRoutes");

const app = express();
const PORT = process.env.PORT || 5000;
const DIST_DIR = path.resolve(__dirname, "..", "dist");
const INDEX_FILE = path.join(DIST_DIR, "index.html");
const hasProductionBuild = fs.existsSync(INDEX_FILE);

if (process.env.NODE_ENV === "production") {
  // Trust the single reverse proxy used by common managed hosting platforms.
  app.set("trust proxy", 1);
}

app.disable("x-powered-by");

const allowedOrigins = (process.env.CLIENT_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim().replace(/\/$/, ""))
  .filter(Boolean);

const corsMiddleware = cors({
  origin(origin, callback) {
    const normalizedOrigin = origin ? origin.replace(/\/$/, "") : "";
    if (!origin || allowedOrigins.includes(normalizedOrigin)) {
      return callback(null, true);
    }

    const error = new Error("This origin is not allowed by SAELYN API CORS.");
    error.code = "CORS_ORIGIN_NOT_ALLOWED";
    return callback(error);
  },
  credentials: true,
});

app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

  // Same-origin production requests do not need CORS headers.
  const origin = req.get("origin");
  const requestOrigin = `${req.protocol}://${req.get("host")}`;
  if (process.env.NODE_ENV === "production" && origin === requestOrigin) {
    return next();
  }

  return corsMiddleware(req, res, next);
});

app.use(express.json({ limit: "100kb" }));

app.get("/api/health", (req, res) => {
  const databaseReady = mongoose.connection.readyState === 1;
  return res.status(databaseReady ? 200 : 503).json({
    success: databaseReady,
    service: "saelyn-api",
    database: databaseReady ? "connected" : "disconnected",
  });
});

app.use("/api/products", productRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/store", storeRoutes);
app.use("/api/assistant", assistantRoutes);

// In production, serve the built React app and keep frontend/API on one origin.
// This also keeps the HttpOnly session cookie first-party in the browser.
if (process.env.NODE_ENV === "production" && hasProductionBuild) {
  app.use(express.static(DIST_DIR, {
    index: false,
    maxAge: "1y",
    immutable: true,
    setHeaders(res, filePath) {
      if (path.basename(filePath) === "index.html") {
        res.setHeader("Cache-Control", "no-cache");
      }
    },
  }));

  app.use((req, res, next) => {
    if (req.method !== "GET" || req.path.startsWith("/api/")) return next();
    if (!req.accepts("html")) return next();
    return res.sendFile(INDEX_FILE);
  });
}

app.use((req, res) => {
  return res.status(404).json({
    success: false,
    message: "The requested resource was not found.",
  });
});

app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);

  if (error && error.code === "CORS_ORIGIN_NOT_ALLOWED") {
    return res.status(403).json({
      success: false,
      message: "This origin is not allowed to access the SAELYN API.",
    });
  }

  if (error && error.type === "entity.too.large") {
    return res.status(413).json({
      success: false,
      message: "The submitted request is too large.",
    });
  }

  if (error && error.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      message: "Some submitted information is invalid.",
    });
  }

  console.error("SAELYN API error:", error.message);
  return res.status(500).json({
    success: false,
    message: "An unexpected server error occurred.",
  });
});

async function startServer() {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is required. Add it to server/.env or the hosting environment variables.");
  }

  await connectDB();
  return app.listen(PORT, () => {
    console.log(`SAELYN server running on port ${PORT}`);
  });
}

if (require.main === module) {
  startServer().catch((error) => {
    console.error("SAELYN failed to start:", error.message);
    process.exit(1);
  });
}

module.exports = { app, startServer };
