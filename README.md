# Chaotic Gaming SDK

Typed contracts and a small Node.js Core API client shared by the website backend, Discord bot and game adapters.

## Included

- Typed API envelopes, player profiles, products, entitlements and public server status
- Normalized game event and server heartbeat contracts
- Plugin manifest, installation and lifecycle contracts
- Fetch-based Core API client with HTTPS enforcement, bearer authentication, bounded timeouts and redirect rejection
- Idempotent order, event, heartbeat, plugin lifecycle and reward delivery methods
- Generic reward worker orchestration with a game-specific, idempotency-aware delivery callback
- Generic plugin lifecycle reconciliation with an injected game-specific runtime adapter

## Development

- Node.js 22+
- `npm install`
- `npm run typecheck`
- `npm test`
- `npm run build`

The package is private and is not published to npm. Consumers should use a pinned Git dependency or workspace/package artifact after an explicit integration review. Never expose service credentials to browser bundles.

The reward worker does not grant items itself. Each game adapter must implement and test the actual game-specific grant operation, use the reward idempotency key to prevent duplicate grants, and acknowledge delivery only after the game confirms it.

The plugin agent does not download or execute artifacts. Each game runtime adapter must verify artifact signatures, game/server compatibility, installation paths and rollback behavior before implementing the injected lifecycle methods.
