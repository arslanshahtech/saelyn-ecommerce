const express = require("express");
const { requireAuth } = require("../middleware/auth");
const { getCart, replaceCart, syncCart } = require("../controllers/cartController");

const router = express.Router();
router.use(requireAuth);
router.get("/", getCart);
router.put("/", replaceCart);
router.post("/sync", syncCart);

module.exports = router;
