import test from "node:test";
import assert from "node:assert/strict";
import { CoreApiClient, CoreApiError } from "../dist/client.js";

test("rejects insecure remote Core URLs", () => {
  assert.throws(() => new CoreApiClient({ baseUrl: "http://core.example.test" }), /HTTPS/);
});

test("allows localhost development URL", () => {
  assert.doesNotThrow(() => new CoreApiClient({ baseUrl: "http://127.0.0.1:3001" }));
});

test("requires a token for authenticated operations", async () => {
  const client = new CoreApiClient({ baseUrl: "https://core.example.test" });
  await assert.rejects(client.getCurrentPlayer(), (error) => error instanceof CoreApiError && error.code === "TOKEN_REQUIRED");
});

test("sends a typed server heartbeat with bearer authentication", async () => {
  let captured;
  const client = new CoreApiClient({
    baseUrl: "https://core.example.test",
    token: "synthetic-service-token",
    fetchImpl: async (url, init) => {
      captured = { url: String(url), init };
      return new Response(JSON.stringify({ data: { accepted: true, serverId: "server-1", receivedAt: "2026-11-12T00:00:00.000Z" } }), { status: 202 });
    },
  });

  const result = await client.sendHeartbeat("server-1", {
    game: "7dtd",
    serverVersion: "2.5",
    adapterVersion: "0.1.0",
    online: true,
  });
  assert.equal(result.data.accepted, true);
  assert.equal(captured.init.headers.get("Authorization"), "Bearer synthetic-service-token");
  assert.equal(captured.init.redirect, "error");
});

test("sends idempotency keys for order creation", async () => {
  let captured;
  const client = new CoreApiClient({
    baseUrl: "https://core.example.test",
    token: "synthetic-player-token",
    fetchImpl: async (_url, init) => {
      captured = init;
      return new Response(JSON.stringify({ data: { orderId: "order-1", status: "pending" } }), { status: 201 });
    },
  });
  await client.createOrder({ currency: "USD", items: [] }, "checkout-123456");
  assert.equal(captured.headers.get("Idempotency-Key"), "checkout-123456");
});
