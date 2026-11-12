export type Identifier = string & { readonly __brand: "Identifier" };
export type ISODateTime = string & { readonly __brand: "ISODateTime" };

export const SUPPORTED_GAMES = ["atlas", "7dtd", "ark"] as const;
export type GameKey = (typeof SUPPORTED_GAMES)[number];
export type ServerStatus = "unknown" | "online" | "offline" | "maintenance" | "retired";

export function isGameKey(value: unknown): value is GameKey {
  return typeof value === "string" && (SUPPORTED_GAMES as readonly string[]).includes(value);
}

export function isServerStatus(value: unknown): value is ServerStatus {
  return value === "unknown" || value === "online" || value === "offline" ||
    value === "maintenance" || value === "retired";
}

export interface ServerReference {
  id: string;
  game: GameKey;
  clusterId: string;
  serverKey: string;
  displayName: string;
  status: ServerStatus;
}

export interface PlayerIdentity {
  principalId?: string;
  provider: string;
  externalId: string;
  displayName?: string;
}

export interface GamePlayer {
  externalPlayerId: string;
  displayName: string;
  connected: boolean;
  firstSeenAt?: ISODateTime;
  lastSeenAt?: ISODateTime;
}

export interface AdapterCapabilities {
  playerLookup: boolean;
  onlinePlayerList: boolean;
  serverStatus: boolean;
  playerMessaging: boolean;
  commandExecution: boolean;
  inventoryDelivery: boolean;
  modManagement: boolean;
}

export interface AdapterHealth {
  healthy: boolean;
  checkedAt: ISODateTime;
  version: string;
  details?: Record<string, unknown>;
}

export interface AdapterResult<T> {
  ok: boolean;
  data?: T;
  error?: { code: string; message: string; retryable: boolean };
  correlationId: string;
}

export interface GameAdapter {
  readonly game: GameKey;
  getCapabilities(): AdapterCapabilities;
  health(server: ServerReference): Promise<AdapterResult<AdapterHealth>>;
  listOnlinePlayers(server: ServerReference): Promise<AdapterResult<GamePlayer[]>>;
  findPlayer(server: ServerReference, externalPlayerId: string): Promise<AdapterResult<GamePlayer | null>>;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    requestId?: string;
    details?: Record<string, unknown>;
  };
}

export interface GameCatalogItem {
  id: GameKey;
  name: string;
  status: "planned" | "development" | "available" | "maintenance" | "retired";
}
