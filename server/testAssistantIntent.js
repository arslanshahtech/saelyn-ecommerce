const assert = require("node:assert/strict");
const { isOwnerQuestion, isShoppingIntent, isGreetingOrCasual } = require("./controllers/assistantController");

const greeting = "Hi!";
assert.equal(isGreetingOrCasual(greeting), true, "greetings should be classified as casual");
assert.equal(isShoppingIntent(greeting, []), false, "greetings should not trigger product cards");

const affection = "I love you";
assert.equal(isGreetingOrCasual(affection), true, "casual affection should receive a conversational response");
assert.equal(isShoppingIntent(affection, []), false, "casual affection should not trigger product cards");

assert.equal(isShoppingIntent("Show me black bags", []), true, "direct product requests should trigger catalog results");
assert.equal(isShoppingIntent("yes", [{ role: "assistant", text: "If you'd like, I can also help you explore our collection." }]), true, "yes should accept a previous shopping invitation");
assert.equal(isShoppingIntent("yes", [{ role: "assistant", text: "How are you doing today?" }]), false, "yes without a shopping invitation should not trigger products");

assert.equal(isOwnerQuestion("Who created you?"), true, "creator questions should use the trusted owner profile");
assert.equal(isOwnerQuestion("Who is the owner of this website?"), true, "website owner questions should be recognized");

console.log("PASS assistant intent: greeting, casual chat, direct shopping, contextual yes/no and owner questions");
