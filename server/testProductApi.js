const assert = require("node:assert/strict");

const API = process.env.API_BASE_URL || "http://localhost:5000/api/products";

async function request(path = "", options = {}) {
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });
  const payload = await response.json();
  return { response, payload };
}

async function run() {
  let createdId;
  const marker = `SAELYN CRUD Test ${Date.now()}`;
  try {
    const list = await request();
    assert.equal(list.response.status, 200, "GET all should return 200");
    assert.equal(list.payload.success, true, "GET all should succeed");
    console.log(`PASS GET all: ${list.payload.count} product(s)`);

    const created = await request("", {
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
    console.log(`PASS POST create: ${createdId}`);

    const single = await request(`/${createdId}`);
    assert.equal(single.response.status, 200, "GET by id should return 200");
    assert.equal(single.payload.product.name, marker, "GET by id should return created product");
    console.log("PASS GET by ID: created product retrieved from MongoDB");

    const filtered = await request(`?search=${encodeURIComponent(marker)}&category=Clothing&minPrice=70&maxPrice=90&color=%23F4F0E8&size=M&material=Linen&sort=price-low`);
    assert.equal(filtered.response.status, 200, "filtered GET should return 200");
    assert.ok(filtered.payload.products.some((item) => item._id === createdId), "search/filter should include matching product");
    console.log("PASS backend search + category + price + color + size + material + sort");

    const updated = await request(`/${createdId}`, {
      method: "PUT",
      body: JSON.stringify({ price: 85, stock: 9 }),
    });
    assert.equal(updated.response.status, 200, "PUT should return 200");
    assert.equal(updated.payload.product.price, 85, "PUT should update price");
    assert.equal(updated.payload.product.stock, 9, "PUT should update stock");
    console.log("PASS PUT update: price and stock persisted");

    const deleted = await request(`/${createdId}`, { method: "DELETE" });
    assert.equal(deleted.response.status, 200, "DELETE should return 200");
    console.log("PASS DELETE: product removed");

    const afterDelete = await request(`/${createdId}`);
    assert.equal(afterDelete.response.status, 404, "deleted product should return 404");
    console.log("PASS DELETE verification: removed product returns 404");
    console.log("ALL PRODUCT API TESTS PASSED");
  } catch (error) {
    console.error("PRODUCT API TEST FAILED:", error.message);
    process.exitCode = 1;
  } finally {
    if (createdId) {
      await request(`/${createdId}`, { method: "DELETE" }).catch(() => {});
    }
  }
}

run();
