require("dotenv").config();
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const { app } = require("./server");
const connectDB = require("./config/db");
const User = require("./models/User");
const Session = require("./models/Session");
const PasswordResetToken = require("./models/PasswordResetToken");

async function run() {
  let server;
  let userId;
  let originalApiKey = process.env.RESEND_API_KEY;
  let originalEmailFrom = process.env.EMAIL_FROM;
  const email = `password-reset-test-${Date.now()}@example.com`;
  const oldPassword = "Old-password-for-test-481";
  const newPassword = "New-password-for-test-592";

  const request = async (base, path, body, cookie = "") => {
    const response = await fetch(`${base}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(cookie ? { Cookie: cookie } : {}),
      },
      body: JSON.stringify(body),
    });
    let payload = {};
    try { payload = await response.json(); } catch {}
    return { response, payload };
  };

  try {
    // Keep integration tests deterministic and prevent real email delivery.
    delete process.env.RESEND_API_KEY;
    delete process.env.EMAIL_FROM;
    if (process.env.NODE_ENV === "production") {
      throw new Error("Run password-reset integration tests outside production.");
    }

    await connectDB();
    await Promise.all([User.init(), Session.init(), PasswordResetToken.init()]);
    const user = await User.create({
      name: "Password Reset Test",
      email,
      password: oldPassword,
      role: "user",
    });
    userId = user._id;

    server = app.listen(0);
    await new Promise((resolve, reject) => {
      server.once("listening", resolve);
      server.once("error", reject);
    });
    const base = `http://127.0.0.1:${server.address().port}/api/auth`;

    const unknown = await request(base, "/forgot-password", { email: `unknown-${email}` });
    assert.equal(unknown.response.status, 200);
    assert.match(unknown.payload.message, /If an account exists/i);
    assert.equal(unknown.payload.developmentResetUrl, undefined);
    console.log("PASS unknown email receives the same generic response");

    const existing = await request(base, "/forgot-password", { email: email.toUpperCase() });
    assert.equal(existing.response.status, 200);
    assert.ok(existing.payload.developmentResetUrl);
    const resetUrl = new URL(existing.payload.developmentResetUrl);
    const token = resetUrl.searchParams.get("token");
    assert.ok(token && token.length >= 40);
    const tokenRecord = await PasswordResetToken.findOne({ user: userId }).select("+tokenHash");
    assert.ok(tokenRecord);
    assert.notEqual(tokenRecord.tokenHash, token, "raw token must never be stored in MongoDB");
    assert.ok(tokenRecord.expiresAt.getTime() > Date.now());
    console.log("PASS reset token is random, hashed at rest and expires");

    const invalid = await request(base, "/reset-password", { token: "invalid-token", password: newPassword });
    assert.equal(invalid.response.status, 400);
    console.log("PASS invalid reset token is rejected");

    const loginBefore = await request(base, "/login", { email, password: oldPassword });
    assert.equal(loginBefore.response.status, 200);
    const cookie = (loginBefore.response.headers.get("set-cookie") || "").split(";")[0];
    assert.ok(cookie.startsWith("saelyn_session="));
    assert.equal(await Session.countDocuments({ user: userId }), 1);

    const reset = await request(base, "/reset-password", { token, password: newPassword });
    assert.equal(reset.response.status, 200, reset.payload.message);
    assert.match(reset.payload.message, /updated successfully/i);
    assert.equal(await Session.countDocuments({ user: userId }), 0);
    assert.equal(await PasswordResetToken.countDocuments({ user: userId }), 0);
    console.log("PASS password changes and all existing sessions/reset tokens are invalidated");

    const reused = await request(base, "/reset-password", { token, password: "Another-password-778" });
    assert.equal(reused.response.status, 400);
    const oldLogin = await request(base, "/login", { email, password: oldPassword });
    assert.equal(oldLogin.response.status, 401);
    const newLogin = await request(base, "/login", { email, password: newPassword });
    assert.equal(newLogin.response.status, 200);
    console.log("PASS reset token is one-time-use and only the new password works");

    const rateLimited = await request(base, "/forgot-password", { email });
    assert.equal(rateLimited.response.status, 429);
    console.log("PASS repeated reset attempts are rate limited");
  } finally {
    if (server) await new Promise((resolve) => server.close(resolve));
    if (userId) {
      await Promise.all([
        User.deleteOne({ _id: userId }),
        Session.deleteMany({ user: userId }),
        PasswordResetToken.deleteMany({ user: userId }),
      ]);
    }
    if (originalApiKey === undefined) delete process.env.RESEND_API_KEY;
    else process.env.RESEND_API_KEY = originalApiKey;
    if (originalEmailFrom === undefined) delete process.env.EMAIL_FROM;
    else process.env.EMAIL_FROM = originalEmailFrom;
    await mongoose.disconnect();
  }
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
