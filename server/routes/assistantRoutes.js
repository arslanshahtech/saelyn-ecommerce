const express = require("express");
const { chat } = require("../controllers/assistantController");
const assistantRateLimit = require("../middleware/assistantRateLimit");

const router = express.Router();
router.post("/chat", assistantRateLimit, chat);

module.exports = router;
