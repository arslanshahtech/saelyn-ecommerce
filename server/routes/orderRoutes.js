const express = require("express");
const { requireAuth } = require("../middleware/auth");
const { createOrder, getMyOrders } = require("../controllers/orderController");

const router = express.Router();
router.use(requireAuth);
router.get("/mine", getMyOrders);
router.post("/", createOrder);

module.exports = router;
