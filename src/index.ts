export type Identifier = string;
export type ISODateTime = string;

export interface ApiError {
  code: string;
  message: string;
  requestId: string;
  details?: Readonly<Record<string, unknown>>;
}

export interface ApiResponse<T> {
  data: T;
  requestId: string;
}

export interface PlayerSummary {
  id: Identifier;
  username: string;
  displayName: string | null;
  status: "pending" | "active" | "suspended" | "disabled" | "deletion_pending";
  createdAt: ISODateTime;
}

export interface LinkedAccountSummary {
  id: Identifier;
  provider: string;
  externalId: string;
  externalUsername: string | null;
  verifiedAt: ISODateTime;
}

export interface ServiceIdentity {
  clientId: string;
  audience: "chaotic-gaming-core";
}

export interface PlatformEvent<TPayload = Record<string, unknown>> {
  id: Identifier;
  type: string;
  version: 1;
  occurredAt: ISODateTime;
  aggregate: { type: string; id: Identifier };
  payload: TPayload;
}

export interface GameAdapterHealth {
  game: "atlas" | "7dtd" | "ark";
  adapterVersion: string;
  connected: boolean;
  checkedAt: ISODateTime;
  details?: Readonly<Record<string, unknown>>;
}
