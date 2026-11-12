export type GameId = "atlas" | "7dtd" | "ark";
export type PrincipalType = "user" | "service";
export type ScopeType = "platform" | "game" | "cluster" | "server" | "guild";
export interface EventEnvelope<TPayload = unknown> { id: string; type: string; occurredAt: string; aggregate: { type: string; id: string }; payload: TPayload; version: 1; }
export interface ServiceIdentity { principalId: string; application: "website" | "glitch-bot" | "atlas-adapter" | "7dtd-adapter" | "ark-adapter"; }
export interface GameServerStatus { gameId: GameId; serverId: string; status: "unknown" | "online" | "offline" | "maintenance"; players?: { current: number; maximum?: number }; observedAt: string; }
export interface PlayerIdentity { playerId: string; linkedAccounts: Array<{ provider: string; externalId: string; verified: boolean }>; }
