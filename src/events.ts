export interface EventEnvelope<TPayload = unknown> {
  id: string;
  type: string;
  version: number;
  occurredAt: string;
  aggregate: { type: string; id: string };
  payload: TPayload;
}

export type ChaoticGamingEventType =
  | "player.account.created"
  | "player.account.linked"
  | "player.account.unlinked"
  | "commerce.purchase.confirmed"
  | "commerce.entitlement.granted"
  | "commerce.reward.queued"
  | "commerce.reward.delivered"
  | "game.player.joined"
  | "game.player.transferred"
  | "game.server.status_changed"
  | "community.ticket.created";
