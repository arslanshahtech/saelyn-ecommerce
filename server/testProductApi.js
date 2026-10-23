require("dotenv").config();
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const { app } = require("./server");
const connectDB = require("./config/db");
const Product = require("./models/Product");
const User = require("./models/User");
const Session = require("./models/Session");

async function run() {
  let server;
  let createdId;
  let adminId;
  let adminCookie = "";
  const marker = `SAELYN CRUD Test ${Date.now()}`;
  const adminEmail = `phase3-admin-${Date.now()}@example.com`;
  const adminPassword = "Phase3-admin-test-password-48";

  async function request(base, path = "", options = {}, cookie = adminCookie) {
    const response = await fetch(`${base}${path}`, {
      ...options,
      headers: {
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...(cookie ? { Cookie: cookie } : {}),
        ...options.headers,
      },
    });
    const payload = await response.json();
    return { response, payload };
  }

  try {
    await connectDB();
    await Promise.all([Product.init(), User.init(), Session.init()]);
    const admin = new User({ name: "Temporary Test Admin", email: adminEmail, password: adminPassword, role: "admin" });
    await admin.save();
    adminId = String(admin._id);

    server = app.listen(0);
    await new Promise((resolve, reject) => {
      server.once("listening", resolve);
      server.once("error", reject);
    });
    const root = `http://127.0.0.1:${server.address().port}/api`;
    const API = `${root}/products`;

    const deniedWrite = await request(API, "", {
      method: "POST",
      body: JSON.stringify({ name: "Unauthorized write" }),
    }, "");
    assert.equal(deniedWrite.response.status, 401, "anonymous product write should be rejected");
    console.log("PASS product writes require authentication");

    const login = await request(root, "/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: adminEmail, password: adminPassword }),
    }, "");
    assert.equal(login.response.status, 200, "temporary admin login should succeed");
    adminCookie = (login.response.headers.get("set-cookie") || "").split(";")[0];
    assert.ok(adminCookie.startsWith("saelyn_session="));
    console.log("PASS catalog test authenticates as administrator");

    const list = await request(API);
    assert.equal(list.response.status, 200, "GET all should return 200");
    assert.equal(list.payload.success, true, "GET all should succeed");
    console.log(`PASS GET all: ${list.payload.count} product(s)`);

    const created = await request(API, "", {
      method: "POST",
      body: JSON.stringify({
        name: marker,
        price: 79,
        image: "https://example.com/saelyn-test.jpg",
        category: "Clothing",
        colors: ["#F4F0E8", "#171717"],
        sizes: ["S", "M", "L"],
        description: "Temporary CRUD integration test product.",
        material: "Linen",
        details: ["Temporary test item"],
        stock: 5,
        featured: false,
      }),
    });
    assert.equal(created.response.status, 201, "POST should return 201");
    assert.equal(created.payload.success, true, "POST should succeed");
    createdId = created.payload.product._id;
    assert.ok(createdId, "POST should return MongoDB _id");
    console.log("PASS admin POST creates product");

    const single = await request(API, `/${createdId}`);
    assert.equal(single.response.status, 200, "GET by id should return 200");
    assert.equal(single.payload.product.name, marker, "GET by id should return created product");
    console.log("PASS GET by ID: created product retrieved from MongoDB");

    const filtered = await request(API, `?search=${encodeURIComponent(marker)}&category=Clothing&minPrice=70&maxPrice=90&color=%23F4F0E8&size=M&material=Linen&sort=price-low`);
    assert.equal(filtered.response.status, 200, "filtered GET should return 200");
    assert.ok(filtered.payload.products.some((item) => item._id === createdId), "search/filter should include matching product");
    console.log("PASS backend search + category + price + color + size + material + sort");

    const invalidPrice = await request(API, "?minPrice=not-a-number");
    assert.equal(invalidPrice.response.status, 400, "non-numeric price filters must be rejected");
    const reversedPrice = await request(API, "?minPrice=100&maxPrice=10");
    assert.equal(reversedPrice.response.status, 400, "reversed price ranges must be rejected");
    const regexMaterial = await request(API, "?material=%28.%2A%29");
    assert.equal(regexMaterial.response.status, 200, "regex characters in material filters must be treated literally");
    assert.ok(!regexMaterial.payload.products.some((item) => item._id === createdId), "regex metacharacters must not act as a wildcard");
    console.log("PASS invalid price filters rejected and material search treats regex input literally");

    const updated = await request(API, `/${createdId}`, {
      method: "PUT",
      body: JSON.stringify({ price: 85, stock: 9 }),
    });
    assert.equal(updated.response.status, 200, "PUT should return 200");
    assert.equal(updated.payload.product.price, 85, "PUT should update price");
    assert.equal(updated.payload.product.stock, 9, "PUT should update stock");
    console.log("PASS admin PUT update: price and stock persisted");

    const deletedId = createdId;
    const deleted = await request(API, `/${deletedId}`, { method: "DELETE" });
    assert.equal(deleted.response.status, 200, "DELETE should return 200");
    createdId = null;
    console.log("PASS admin DELETE removes product");

    const afterDelete = await request(API, `/${deletedId}`);
    assert.equal(afterDelete.response.status, 404, "deleted product should return 404");
    console.log("PASS DELETE verification: removed product returns 404");
    console.log("ALL PRODUCT API TESTS PASSED");
  } catch (error) {
    console.error("PRODUCT API TEST FAILED:", error.message);
    process.exitCode = 1;
  } finally {
    if (createdId) await Product.deleteOne({ _id: createdId }).catch(() => {});
    if (adminId) {
      await Session.deleteMany({ user: adminId }).catch(() => {});
      await User.deleteOne({ _id: adminId }).catch(() => {});
    }
    if (server) await new Promise((resolve) => server.close(resolve));
    await mongoose.disconnect().catch(() => {});
  }
}

run();
