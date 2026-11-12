export const CORE_API_CONTRACT_VERSION = "0.2.0" as const;

export type GameKey = "atlas" | "7dtd" | "ark";
export type PluginGame = GameKey | "platform";
export type ScopeType = "platform" | "game" | "cluster" | "server" | "guild";
export type PluginLifecycleStatus =
  | "DISCOVERED"
  | "VALIDATED"
  | "ENABLED"
  | "HEALTHY"
  | "DEGRADED"
  | "DISABLED"
  | "REMOVED";

export interface ApiSuccess<T> {
  data: T;
  requestId?: string;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  requestId?: string;
}

export interface PlayerProfile {
  id: string;
  username: string;
  displayName: string | null;
  status: "active" | "suspended" | "disabled" | "deletion_pending";
  createdAt: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  productType: string;
  currency: string;
  amountMinor: string;
}

export interface Entitlement {
  id: string;
  status: string;
  grantedAt: string;
  expiresAt: string | null;
  sku: string;
  name: string;
  productType: string;
}

export interface CreateOrderRequest {
  currency: string;
  items: Array<{ productId: string; quantity: number }>;
}

export interface CreateOrderResponse {
  orderId: string;
  status: string;
  currency?: string;
  totalMinor?: string;
  reused?: boolean;
}

export interface GameServerStatus {
  id: string;
  name: string;
  gameKey: GameKey;
  clusterName: string;
  configuredStatus: string;
  online: boolean;
  playerCount: number | null;
  serverVersion: string | null;
  adapterVersion: string | null;
  lastHeartbeat: string | null;
}

export interface ServerHeartbeat {
  game: GameKey;
  serverVersion: string;
  adapterVersion: string;
  online: boolean;
  playerCount?: number;
  observedAt?: string;
}

export type NormalizedGameEventType =
  | "player.joined"
  | "player.left"
  | "player.chat"
  | "server.started"
  | "server.stopped"
  | "player.died";

export interface NormalizedGameEvent {
  game: GameKey;
  eventId: string;
  eventType: NormalizedGameEventType;
  occurredAt: string;
  payload: Record<string, unknown>;
}

export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  game: PluginGame;
  apiVersion: string;
  dependencies: string[];
  capabilities: string[];
  permissions: string[];
  compatibility: {
    gameBuilds: string[];
    serverApi: string[];
    operatingSystems: string[];
  };
  configSchema?: Record<string, unknown>;
}

export interface PluginSummary {
  id: string;
  name: string;
  game: PluginGame;
  latestVersion: string;
  status: PluginLifecycleStatus;
  capabilities: string[];
}

export interface PluginInstallation {
  id: string;
  pluginId: string;
  name: string;
  game: PluginGame;
  version: string;
  lifecycleStatus: PluginLifecycleStatus;
  desiredState: "enabled" | "disabled";
  healthMessage: string | null;
  lastHealthAt: string | null;
  updatedAt: string;
}

export interface PluginHealthReport {
  lifecycleStatus: Exclude<PluginLifecycleStatus, "DISCOVERED">;
  healthMessage?: string | null;
}

export interface SetPluginDesiredStateRequest {
  desiredState: "enabled" | "disabled";
}
