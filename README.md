# Chaotic Minds Gaming SDK (CMG)

Shared TypeScript contracts for the Chaotic Minds Gaming (CMG) Core API, websites, Discord bots, and game plugins.

## Principles
- Contracts only: no database connection, secrets, or runtime coupling.
- Stable, versioned API and event shapes.
- Game adapters expose capabilities explicitly; unsupported operations must not be guessed.
- External identifiers remain strings and are namespaced by provider/game.
