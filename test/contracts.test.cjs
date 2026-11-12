const test = require("node:test");
const assert = require("node:assert/strict");
const { SUPPORTED_GAMES, isGameKey, isServerStatus } = require("../dist/index.js");

test("SDK exposes the supported game identifiers", () => {
  assert.deepEqual(SUPPORTED_GAMES, ["atlas", "7dtd", "ark"]);
});

test("game key validation rejects unknown or malformed identifiers", () => {
  assert.equal(isGameKey("atlas"), true);
  assert.equal(isGameKey("7dtd"), true);
  assert.equal(isGameKey("ark"), true);
  assert.equal(isGameKey("minecraft"), false);
  assert.equal(isGameKey(null), false);
});

test("server status validation accepts only the contract enum", () => {
  for (const status of ["unknown", "online", "offline", "maintenance", "retired"]) {
    assert.equal(isServerStatus(status), true);
  }
  assert.equal(isServerStatus("starting"), false);
});
