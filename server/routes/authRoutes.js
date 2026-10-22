const express = require("express");
const { register, login, logout, me } = require("../controllers/authController");
const { forgotPassword, resetPassword } = require("../controllers/passwordResetController");
const passwordResetRateLimit = require("../middleware/passwordResetRateLimit");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.post("/forgot-password", passwordResetRateLimit, forgotPassword);
router.post("/reset-password", passwordResetRateLimit, resetPassword);
router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.get("/me", requireAuth, me);

module.exports = router;
