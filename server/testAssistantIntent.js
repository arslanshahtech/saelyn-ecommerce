const assert = require("node:assert/strict");
const { isOwnerQuestion, isShoppingIntent, isGreetingOrCasual, getCasualReply } = require("./controllers/assistantController");

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
assert.equal(isOwnerQuestion("Who is the owner of SAELYN?"), true, "SAELYN owner questions should be recognized");
assert.equal(isOwnerQuestion("Who is your owner?"), true, "direct owner questions should be recognized");
assert.equal(isOwnerQuestion("Who is SAELYN's owner?"), true, "possessive brand owner questions should be recognized");
assert.equal(isGreetingOrCasual("No thanks, I just want to chat"), true, "declining shopping should be classified as casual");
assert.equal(isShoppingIntent("No thanks, I just want to chat", [{ role: "assistant", text: "Would you like to explore our collection?" }]), false, "declining shopping must not trigger products");
assert.match(getCasualReply("Hi"), /How’s your day going/, "greetings should receive a natural reply");
assert.match(getCasualReply("no thanks"), /just chat/i, "declining shopping should keep the conversation casual");
assert.match(getCasualReply("Who are you?"), /SAELYN/i, "identity questions should describe the SAELYN assistant");

console.log("PASS assistant intent: greeting, casual chat, direct shopping, contextual yes/no and owner questions");
