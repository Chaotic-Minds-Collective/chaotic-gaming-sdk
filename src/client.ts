import type {
  AcknowledgeRewardRequest,
  AcknowledgeRewardResponse,
  ApiSuccess,
  ClaimRewardsRequest,
  CreateOrderRequest,
  CreateOrderResponse,
  Entitlement,
  GameServerStatus,
  NormalizedGameEvent,
  PlayerProfile,
  PluginHealthReport,
  PluginInstallation,
  PluginManifest,
  PluginSummary,
  Product,
  RewardDelivery,
  ServerHeartbeat,
  SetPluginDesiredStateRequest,
} from "./contracts.js";

export class CoreApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(message: string, status: number, code = "CORE_API_ERROR") {
    super(message);
    this.name = "CoreApiError";
    this.status = status;
    this.code = code;
  }
}

export interface CoreApiClientOptions {
  baseUrl: string;
  token?: string;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}

export class CoreApiClient {
  private readonly baseUrl: string;
  private readonly token: string | undefined;
  private readonly fetchImpl: typeof fetch;
  private readonly timeoutMs: number;

  constructor(options: CoreApiClientOptions) {
    const parsed = new URL(options.baseUrl);
    const localHttp = parsed.protocol === "http:" && ["localhost", "127.0.0.1"].includes(parsed.hostname);
    if (parsed.protocol !== "https:" && !localHttp) {
      throw new TypeError("Core API must use HTTPS outside localhost.");
    }
    if (options.token !== undefined && options.token.trim().length === 0) {
      throw new TypeError("Core API token cannot be empty.");
    }
    this.baseUrl = parsed.origin;
    this.token = options.token;
    this.fetchImpl = options.fetchImpl ?? globalThis.fetch;
    this.timeoutMs = options.timeoutMs ?? 5_000;
  }

  private async request<T>(path: string, init: RequestInit = {}, requireToken = false): Promise<T> {
    if (requireToken && !this.token) throw new CoreApiError("This Core API operation requires a service or player token.", 401, "TOKEN_REQUIRED");
    const headers = new Headers(init.headers);
    headers.set("Accept", "application/json");
    if (init.body !== undefined) headers.set("Content-Type", "application/json");
    if (this.token) headers.set("Authorization", `Bearer ${this.token}`);

    let response: Response;
    try {
      response = await this.fetchImpl(new URL(path, this.baseUrl), {
        ...init,
        headers,
        redirect: "error",
        signal: AbortSignal.timeout(this.timeoutMs),
      });
    } catch {
      throw new CoreApiError("The Core API request could not be completed.", 0, "NETWORK_ERROR");
    }

    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      throw new CoreApiError("The Core API returned an invalid response.", response.status, "INVALID_RESPONSE");
    }
    if (!response.ok) {
      const error = payload as { error?: { code?: string; message?: string } };
      throw new CoreApiError(
        error.error?.message ?? "The Core API rejected the request.",
        response.status,
        error.error?.code ?? "CORE_API_ERROR"
      );
    }
    return payload as T;
  }

  async getProducts(currency = "USD"): Promise<ApiSuccess<Product[]>> {
    return this.request(`/catalog/products?currency=${encodeURIComponent(currency.toUpperCase())}`);
  }

  async getServers(): Promise<ApiSuccess<GameServerStatus[]>> {
    return this.request("/servers");
  }

  async getPlugins(): Promise<ApiSuccess<PluginSummary[]>> {
    return this.request("/plugins");
  }

  async getCurrentPlayer(): Promise<ApiSuccess<PlayerProfile>> {
    return this.request("/auth/me", {}, true);
  }

  async getEntitlements(): Promise<ApiSuccess<Entitlement[]>> {
    return this.request("/account/entitlements", {}, true);
  }

  async createOrder(order: CreateOrderRequest, idempotencyKey: string): Promise<ApiSuccess<CreateOrderResponse>> {
    if (!idempotencyKey || idempotencyKey.length < 8 || idempotencyKey.length > 128) {
      throw new TypeError("Idempotency key must be between 8 and 128 characters.");
    }
    return this.request("/commerce/orders", {
      method: "POST",
      headers: { "Idempotency-Key": idempotencyKey },
      body: JSON.stringify(order),
    }, true);
  }

  async sendHeartbeat(serverId: string, heartbeat: ServerHeartbeat): Promise<ApiSuccess<{ accepted: boolean; serverId: string; receivedAt: string }>> {
    return this.request(`/integrations/servers/${encodeURIComponent(serverId)}/heartbeat`, {
      method: "POST",
      body: JSON.stringify(heartbeat),
    }, true);
  }

  async publishGameEvent(serverId: string, event: NormalizedGameEvent): Promise<ApiSuccess<{ accepted: boolean; duplicate: boolean; serverId: string; eventId: string }>> {
    return this.request(`/integrations/servers/${encodeURIComponent(serverId)}/events`, {
      method: "POST",
      body: JSON.stringify(event),
    }, true);
  }

  async registerPlugin(manifest: PluginManifest, artifactDigest?: string, artifactUrl?: string): Promise<ApiSuccess<{ id: string; name: string; version: string; status: string }>> {
    return this.request("/plugins", {
      method: "POST",
      body: JSON.stringify({
        manifest,
        ...(artifactDigest ? { artifactDigest } : {}),
        ...(artifactUrl ? { artifactUrl } : {}),
      }),
    }, true);
  }

  async getServerPlugins(serverId: string): Promise<ApiSuccess<PluginInstallation[]>> {
    return this.request(`/servers/${encodeURIComponent(serverId)}/plugins`, {}, true);
  }

  async setPluginDesiredState(serverId: string, pluginId: string, body: SetPluginDesiredStateRequest): Promise<ApiSuccess<PluginInstallation>> {
    return this.request(`/servers/${encodeURIComponent(serverId)}/plugins/${encodeURIComponent(pluginId)}/state`, {
      method: "POST",
      body: JSON.stringify(body),
    }, true);
  }

  async reportPluginHealth(serverId: string, pluginId: string, report: PluginHealthReport): Promise<ApiSuccess<PluginInstallation>> {
    return this.request(`/integrations/servers/${encodeURIComponent(serverId)}/plugins/${encodeURIComponent(pluginId)}/health`, {
      method: "POST",
      body: JSON.stringify(report),
    }, true);
  }

  async claimRewards(serverId: string, request: ClaimRewardsRequest = {}): Promise<ApiSuccess<RewardDelivery[]>> {
    return this.request(`/integrations/servers/${encodeURIComponent(serverId)}/rewards/claim`, {
      method: "POST",
      body: JSON.stringify(request),
    }, true);
  }

  async acknowledgeReward(serverId: string, rewardId: string, request: AcknowledgeRewardRequest): Promise<ApiSuccess<AcknowledgeRewardResponse>> {
    return this.request(`/integrations/servers/${encodeURIComponent(serverId)}/rewards/${encodeURIComponent(rewardId)}/ack`, {
      method: "POST",
      body: JSON.stringify(request),
    }, true);
  }
}
