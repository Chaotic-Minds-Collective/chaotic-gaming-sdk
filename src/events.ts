import type { GameKey, ISODateTime } from "./index.js";

export interface EventEnvelope<TPayload extends Record<string, unknown> = Record<string, unknown>> {
  id: string;
  type: string;
  version: 1;
  occurredAt: ISODateTime;
  producer: string;
  correlationId?: string;
  aggregate: { type: string; id: string };
  payload: TPayload;
}

export interface PlayerJoinedPayload {
  game: GameKey;
  serverId: string;
  externalPlayerId: string;
  principalId?: string;
}

export interface PlayerTransferredPayload {
  game: GameKey;
  clusterId: string;
  externalPlayerId: string;
  sourceServerId?: string;
  destinationServerId?: string;
}

export interface ServerStatusChangedPayload {
  game: GameKey;
  serverId: string;
  previousStatus: string;
  currentStatus: string;
}
