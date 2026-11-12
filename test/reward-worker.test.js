import test from "node:test";
import assert from "node:assert/strict";
import { processRewardBatch } from "../dist/reward-worker.js";

const reward = (id) => ({
  id,
  entitlementId: "entitlement-1",
  game: "7dtd",
  targetExternalId: "steam-player-1",
  deliveryPayload: { item: "medical-kit", quantity: 1 },
  attempts: 1,
  idempotencyKey: `reward-${id}`,
  leaseExpiresAt: "2026-11-12T17:00:00.000Z",
});

test("delivers claimed rewards and acknowledges with the provider receipt", async () => {
  let ack;
  const client = {
    claimRewards: async () => ({ data: [reward("r1")] }),
    acknowledgeReward: async (_serverId, rewardId, body) => {
      ack = { rewardId, body };
      return { data: { accepted: true, duplicate: false, rewardId, outcome: "delivered" } };
    },
  };
  const result = await processRewardBatch(client, "server-1", async (item) => {
    assert.equal(item.idempotencyKey, "reward-r1");
    return { gameReceipt: "grant-1" };
  });
  assert.deepEqual(result, { claimed: 1, delivered: 1, failed: 0, acknowledgementFailures: 0 });
  assert.equal(ack.body.outcome, "delivered");
  assert.equal(ack.body.response.gameReceipt, "grant-1");
});

test("reports game delivery failures back to Core for retry", async () => {
  let ack;
  const client = {
    claimRewards: async () => ({ data: [reward("r2")] }),
    acknowledgeReward: async (_serverId, rewardId, body) => {
      ack = { rewardId, body };
      return { data: { accepted: true, duplicate: false, rewardId, outcome: "failed" } };
    },
  };
  const result = await processRewardBatch(client, "server-1", async () => {
    throw new Error("Player is not currently online.");
  });
  assert.deepEqual(result, { claimed: 1, delivered: 0, failed: 1, acknowledgementFailures: 0 });
  assert.equal(ack.body.outcome, "failed");
  assert.equal(ack.body.error, "Player is not currently online.");
});

test("records acknowledgement failures without pretending delivery was confirmed", async () => {
  const client = {
    claimRewards: async () => ({ data: [reward("r3")] }),
    acknowledgeReward: async () => { throw new Error("Core unavailable"); },
  };
  const result = await processRewardBatch(client, "server-1", async () => ({ gameReceipt: "grant-3" }));
  assert.deepEqual(result, { claimed: 1, delivered: 0, failed: 0, acknowledgementFailures: 1 });
});
