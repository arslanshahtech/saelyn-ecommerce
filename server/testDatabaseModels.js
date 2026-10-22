const assert = require("node:assert/strict");
const mongoose = require("mongoose");

const Product = require("./models/Product");
const User = require("./models/User");
const Order = require("./models/Order");
const Cart = require("./models/Cart");
const Wishlist = require("./models/Wishlist");

const id = () => new mongoose.Types.ObjectId();

async function expectValid(label, document) {
  await document.validate();
  console.log(`PASS ${label}`);
}

async function expectInvalid(label, document, expectedPath) {
  await assert.rejects(document.validate(), (error) => {
    assert.ok(error instanceof mongoose.Error.ValidationError);
    if (expectedPath) {
      const paths = Object.keys(error.errors);
      assert.ok(
        error.errors[expectedPath] || paths.some((path) => path.startsWith(`${expectedPath}.`)),
        `Expected validation error for ${expectedPath}; got: ${paths.join(", ")}`
      );
    }
    return true;
  });
  console.log(`PASS ${label}`);
}

async function run() {
  try {
    const productId = id();
    const userId = id();

    await expectValid("Product model accepts a valid product", new Product({
      name: "Model Test Tee",
      price: 49,
      image: "https://example.com/tee.jpg",
      category: "Clothing",
      description: "Temporary schema validation product.",
      material: "Cotton",
      stock: 3,
    }));
    await expectInvalid("Product model rejects a negative price", new Product({
      name: "Invalid",
      price: -1,
      image: "https://example.com/invalid.jpg",
      category: "Clothing",
      description: "Invalid test",
      material: "Cotton",
    }), "price");

    const user = new User({
      name: " Schema Test User ",
      email: " TEST@EXAMPLE.COM ",
      passwordHash: "test-hash-not-a-real-password",
    });
    await expectValid("User model accepts a valid user", user);
    assert.equal(user.email, "test@example.com", "Email should be trimmed and lowercased");
    assert.equal(user.role, "user", "New users should default to user role");
    assert.equal(user.isActive, true, "New users should default to active");
    console.log("PASS User model normalizes email and applies safe defaults");
    assert.equal(User.schema.path("passwordHash").options.select, false, "Password hash should be excluded from normal queries");
    console.log("PASS User model excludes password hashes from normal query results");

    const passwordUser = new User({
      name: "Password Test User",
      email: "password-test@example.com",
      passwordHash: "placeholder-replaced-by-hook",
    });
    passwordUser.password = "StrongTestPassword123";
    await passwordUser.validate();
    assert.match(passwordUser.passwordHash, /^scrypt\$[a-f0-9]+\$[a-f0-9]+$/);
    assert.notEqual(passwordUser.passwordHash, "StrongTestPassword123");
    assert.equal(await passwordUser.comparePassword("StrongTestPassword123"), true);
    assert.equal(await passwordUser.comparePassword("WrongPassword123"), false);
    console.log("PASS Password virtual hashes with salted scrypt and verifies correct/incorrect passwords");

    await expectInvalid("User model rejects a short password", new User({
      name: "Short Password",
      email: "short-password@example.com",
      passwordHash: "placeholder",
      password: "short",
    }), "passwordHash");

    await expectInvalid("User model rejects an invalid email", new User({
      name: "Invalid Email",
      email: "not-an-email",
      passwordHash: "hash",
    }), "email");
    await expectInvalid("User model rejects a missing password hash", new User({
      name: "No Password",
      email: "no-password@example.com",
    }), "passwordHash");
    await expectInvalid("User model rejects an unsupported role", new User({
      name: "Bad Role",
      email: "role@example.com",
      passwordHash: "hash",
      role: "superuser",
    }), "role");

    const orderData = {
      orderNumber: `TEST-${Date.now()}`,
      customer: {
        firstName: "Test",
        lastName: "Customer",
        email: "customer@example.com",
        phone: "03001234567",
      },
      shippingAddress: {
        address: "1 Test Street",
        city: "Lahore",
        postalCode: "54000",
        country: "Pakistan",
      },
      items: [{
        product: productId,
        name: "Model Test Tee",
        price: 49,
        image: "https://example.com/tee.jpg",
        quantity: 2,
      }],
      subtotal: 98,
      shippingCost: 0,
      total: 98,
    };
    const order = new Order(orderData);
    await expectValid("Order model accepts a valid order snapshot", order);
    assert.equal(order.paymentStatus, "pending");
    assert.equal(order.orderStatus, "pending");
    console.log("PASS Order model applies pending status defaults");

    await expectInvalid("Order model rejects an invalid customer email", new Order({
      ...orderData,
      orderNumber: `BAD-EMAIL-${Date.now()}`,
      customer: { ...orderData.customer, email: "invalid-email" },
    }), "customer");
    await expectInvalid("Order model rejects an empty item list", new Order({
      ...orderData,
      orderNumber: `EMPTY-${Date.now()}`,
      items: [],
      subtotal: 0,
      shippingCost: 0,
      total: 0,
    }), "items");
    await expectInvalid("Order model rejects an incorrect subtotal", new Order({
      ...orderData,
      orderNumber: `BAD-SUBTOTAL-${Date.now()}`,
      subtotal: 97,
      total: 97,
    }), "subtotal");
    await expectInvalid("Order model rejects an incorrect total", new Order({
      ...orderData,
      orderNumber: `BAD-TOTAL-${Date.now()}`,
      total: 100,
    }), "total");
    await expectInvalid("Order model rejects a malformed product reference", new Order({
      ...orderData,
      orderNumber: `BAD-PRODUCT-REF-${Date.now()}`,
      items: [{ ...orderData.items[0], product: "not-an-object-id" }],
    }), "items");

    await expectValid("Cart model accepts a valid user cart", new Cart({
      user: userId,
      items: [{ product: productId, quantity: 2, selectedSize: "M", selectedColor: "Black" }],
    }));
    await expectInvalid("Cart model rejects a zero quantity", new Cart({
      user: userId,
      items: [{ product: productId, quantity: 0 }],
    }), "items");
    await expectInvalid("Cart model rejects a malformed product reference", new Cart({
      user: userId,
      items: [{ product: "not-an-object-id", quantity: 1 }],
    }), "items");

    await expectValid("Wishlist model accepts a valid wishlist", new Wishlist({
      user: userId,
      items: [{ product: productId }],
    }));
    await expectInvalid("Wishlist model rejects duplicate product references", new Wishlist({
      user: userId,
      items: [{ product: productId }, { product: productId }],
    }), "items");
    await expectInvalid("Wishlist model rejects a malformed product reference", new Wishlist({
      user: userId,
      items: [{ product: "not-an-object-id" }],
    }), "items");
    await expectInvalid("Wishlist model rejects a missing user", new Wishlist({
      items: [{ product: productId }],
    }), "user");

    console.log("ALL DATABASE MODEL TESTS PASSED");
  } catch (error) {
    console.error("DATABASE MODEL TEST FAILED:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect().catch(() => {});
  }
}

run();
