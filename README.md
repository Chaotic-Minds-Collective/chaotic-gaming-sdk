# Chaotic Gaming SDK

Shared TypeScript contracts used by the Core API, website, Discord bot and game adapters.

## Principles
- Contracts only: no database connection, secrets, or runtime coupling.
- Stable, versioned API and event shapes.
- Game adapters expose capabilities explicitly; unsupported operations must not be guessed.
- External identifiers remain strings and are namespaced by provider/game.
