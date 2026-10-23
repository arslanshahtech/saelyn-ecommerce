require("dotenv").config();
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const { app } = require("./server");
const connectDB = require("./config/db");
const User = require("./models/User");
const Session = require("./models/Session");
const Product = require("./models/Product");
const Cart = require("./models/Cart");
const Wishlist = require("./models/Wishlist");
const Order = require("./models/Order");

async function run() {
  let server;
  let createdUserId;
  let createdProductId;
  let createdOrderId;
  let cookie = "";
  const email = `phase3-test-${Date.now()}@example.com`;
  const password = "Phase3-test-password-48";

  const request = async (base, path, options = {}, sessionCookie = "") => {
    const response = await fetch(`${base}${path}`, {
      ...options,
      headers: {
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...(sessionCookie ? { Cookie: sessionCookie } : {}),
        ...options.headers,
      },
    });
    let payload = {};
    try { payload = await response.json(); } catch {}
    return { response, payload };
  };

  try {
    await connectDB();
    await Promise.all([User.init(), Session.init(), Cart.init(), Wishlist.init(), Order.init(), Product.init()]);
    const testProduct = await Product.create({
      name: `Phase 3 test product ${Date.now()}`,
      price: 49,
      image: "https://example.com/saelyn-phase3-test.jpg",
      category: "Clothing",
      merchandisingCollection: "new-in",
      colors: ["#111111"],
      sizes: ["M"],
      description: "Temporary test product for Phase 3 integration tests.",
      material: "Cotton",
      details: ["Temporary test item"],
      stock: 3,
      featured: false,
    });
    createdProductId = String(testProduct._id);

    server = app.listen(0);
    await new Promise((resolve, reject) => {
      server.once("listening", resolve);
      server.once("error", reject);
    });
    const base = `http://127.0.0.1:${server.address().port}/api`;

    const unauthenticated = await request(base, "/auth/me");
    assert.equal(unauthenticated.response.status, 401);
    const malformedCookie = await request(base, "/auth/me", { headers: { Cookie: "saelyn_session=%E0%A4%A" } });
    assert.equal(malformedCookie.response.status, 401, "malformed encoded cookies must fail closed without a server error");
    console.log("PASS malformed session cookies are rejected safely");
    assert.equal((await request(base, "/cart")).response.status, 401);
    assert.equal((await request(base, "/wishlist")).response.status, 401);
    assert.equal((await request(base, "/orders/mine")).response.status, 401);
    console.log("PASS private account, cart, wishlist and orders reject guests");

    const invalid = await request(base, "/auth/register", {
      method: "POST",
      body: JSON.stringify({ name: "A", email: "bad-email", password: "short" }),
    });
    assert.equal(invalid.response.status, 400);
    console.log("PASS registration validates name, email and password");

    const registered = await request(base, "/auth/register", {
      method: "POST",
      body: JSON.stringify({ name: "Phase Three Test", email, password, phone: "03001234567" }),
    });
    assert.equal(registered.response.status, 201, registered.payload.message);
    assert.equal(registered.payload.user.email, email);
    assert.equal(registered.payload.user.role, "user");
    assert.ok(!("passwordHash" in registered.payload.user));
    assert.ok(!("password" in registered.payload.user));
    createdUserId = registered.payload.user.id;
    const setCookie = registered.response.headers.get("set-cookie") || "";
    cookie = setCookie.split(";")[0];
    assert.ok(cookie.startsWith("saelyn_session="));
    assert.match(setCookie, /HttpOnly/i);
    assert.match(setCookie, /SameSite=Lax/i);
    console.log("PASS registration creates customer and sets HttpOnly/SameSite session cookie without exposing password");

    const currentUser = await request(base, "/auth/me", {}, cookie);
    assert.equal(currentUser.response.status, 200);
    assert.equal(currentUser.payload.user.id, createdUserId);
    console.log("PASS session authenticates /me");

    const customerWrite = await request(base, "/products", {
      method: "POST",
      body: JSON.stringify({ name: "Customer must not create products" }),
    }, cookie);
    assert.equal(customerWrite.response.status, 403);
    console.log("PASS customer role cannot access administrator-only catalog writes");

    const duplicate = await request(base, "/auth/register", {
      method: "POST",
      body: JSON.stringify({ name: "Duplicate Test", email: email.toUpperCase(), password }),
    });
    assert.equal(duplicate.response.status, 409);
    console.log("PASS duplicate case-insensitive email is rejected");

    const cartSync = await request(base, "/cart/sync", {
      method: "POST",
      body: JSON.stringify({ items: [{ productId: createdProductId, quantity: 1, selectedSize: "M", selectedColor: "#111111" }] }),
    }, cookie);
    assert.equal(cartSync.response.status, 200, cartSync.payload.message);
    assert.equal(cartSync.payload.items.length, 1);
    assert.equal(cartSync.payload.items[0].numericPrice, 49);
    const cartMerged = await request(base, "/cart/sync", {
      method: "POST",
      body: JSON.stringify({ items: [{ productId: createdProductId, quantity: 1, selectedSize: "M", selectedColor: "#111111" }] }),
    }, cookie);
    assert.equal(cartMerged.payload.items[0].quantity, 2);
    console.log("PASS cart sync validates product and merges matching variants");

    const cartCleared = await request(base, "/cart", {
      method: "PUT",
      body: JSON.stringify({ items: [] }),
    }, cookie);
    assert.equal(cartCleared.response.status, 200);
    assert.equal(cartCleared.payload.items.length, 0);
    console.log("PASS cart can be saved and cleared");

    const wishlistSync = await request(base, "/wishlist/sync", {
      method: "POST",
      body: JSON.stringify({ items: [{ productId: createdProductId }, { productId: createdProductId }] }),
    }, cookie);
    assert.equal(wishlistSync.response.status, 200, wishlistSync.payload.message);
    assert.equal(wishlistSync.payload.items.length, 1);
    const wishlistRead = await request(base, "/wishlist");
    assert.equal(wishlistRead.response.status, 401, "wishlist remains private without cookie");
    const wishlistSaved = await request(base, "/wishlist", {
      method: "PUT",
      body: JSON.stringify({ items: [] }),
    }, cookie);
    assert.equal(wishlistSaved.response.status, 200);
    assert.equal(wishlistSaved.payload.items.length, 0);
    console.log("PASS wishlist sync deduplicates product IDs and persists per user");

    const cardOrder = await request(base, "/orders", {
      method: "POST",
      body: JSON.stringify({
        customer: { firstName: "Phase", lastName: "Tester", email, phone: "03001234567" },
        shippingAddress: { address: "1 Test Road", city: "Lahore", postalCode: "54000", country: "Pakistan" },
        shippingMethod: "standard", paymentMethod: "card",
        items: [{ productId: createdProductId, quantity: 1, selectedSize: "M", selectedColor: "#111111" }],
      }),
    }, cookie);
    assert.equal(cardOrder.response.status, 400);
    console.log("PASS checkout refuses card payments until a real payment provider is configured");

    const placedOrder = await request(base, "/orders", {
      method: "POST",
      body: JSON.stringify({
        customer: { firstName: "Phase", lastName: "Tester", email, phone: "03001234567" },
        shippingAddress: { address: "1 Test Road", apartment: "Unit 2", city: "Lahore", postalCode: "54000", country: "Pakistan" },
        shippingMethod: "express", paymentMethod: "cod",
        items: [{ productId: createdProductId, quantity: 1, selectedSize: "M", selectedColor: "#111111" }],
      }),
    }, cookie);
    assert.equal(placedOrder.response.status, 201, placedOrder.payload.message);
    assert.equal(placedOrder.payload.order.subtotal, 49);
    assert.equal(placedOrder.payload.order.shippingCost, 15);
    assert.equal(placedOrder.payload.order.total, 64);
    assert.equal(placedOrder.payload.order.paymentStatus, "pending");
    createdOrderId = placedOrder.payload.order.id;
    const stockAfterOrder = await Product.findById(createdProductId);
    assert.equal(stockAfterOrder.stock, 2);
    const myOrders = await request(base, "/orders/mine", {}, cookie);
    assert.equal(myOrders.response.status, 200);
    assert.ok(myOrders.payload.orders.some((order) => String(order._id) === createdOrderId));
    console.log("PASS checkout uses database prices, calculates totals, decrements stock and stores order history");

    const wrongPassword = await request(base, "/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password: "wrong-password" }),
    });
    assert.equal(wrongPassword.response.status, 401);
    console.log("PASS login rejects an incorrect password");

    const loggedOut = await request(base, "/auth/logout", { method: "POST" }, cookie);
    assert.equal(loggedOut.response.status, 200);
    const afterLogout = await request(base, "/auth/me", {}, cookie);
    assert.equal(afterLogout.response.status, 401);
    console.log("PASS logout invalidates server-side session");

    const loggedIn = await request(base, "/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    assert.equal(loggedIn.response.status, 200, loggedIn.payload.message);
    cookie = (loggedIn.response.headers.get("set-cookie") || "").split(";")[0];
    const afterLogin = await request(base, "/auth/me", {}, cookie);
    assert.equal(afterLogin.response.status, 200);
    console.log("PASS valid login issues a working session");
    console.log("ALL PHASE 3 AUTH, CART, WISHLIST AND ORDER API TESTS PASSED");
  } catch (error) {
    console.error("PHASE 3 INTEGRATION TEST FAILED:", error.message);
    process.exitCode = 1;
  } finally {
    if (createdOrderId) await Order.deleteOne({ _id: createdOrderId }).catch(() => {});
    if (createdUserId) {
      await Promise.all([
        Session.deleteMany({ user: createdUserId }),
        Cart.deleteMany({ user: createdUserId }),
        Wishlist.deleteMany({ user: createdUserId }),
        User.deleteOne({ _id: createdUserId }),
      ]).catch(() => {});
    }
    if (createdProductId) await Product.deleteOne({ _id: createdProductId }).catch(() => {});
    if (server) await new Promise((resolve) => server.close(resolve));
    await mongoose.disconnect().catch(() => {});
  }
}

run();
