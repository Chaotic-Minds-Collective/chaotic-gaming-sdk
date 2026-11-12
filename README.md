# Chaotic Gaming SDK

Typed contracts and a small Node.js Core API client shared by the website backend, Discord bot and game adapters.

## Included

- Typed API envelopes, player profiles, products, entitlements and server status
- Normalized game event and server heartbeat contracts
- Plugin manifest, installation and lifecycle contracts
- Fetch-based Core API client with HTTPS enforcement, bearer authentication, bounded timeouts and redirect rejection
- Idempotent order, event, heartbeat and plugin lifecycle methods

## Development

- Node.js 22+
- `npm install`
- `npm run typecheck`
- `npm test`
- `npm run build`

The package is private and is not published to npm. Consumers should use a pinned Git dependency or workspace/package artifact after an explicit integration review. Never expose service credentials to browser bundles.
