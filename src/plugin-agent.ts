import type { CoreApiClient } from "./client.js";
import type { PluginInstallation } from "./contracts.js";

export interface PluginRuntimeAdapter {
  validate(installation: PluginInstallation): Promise<void>;
  enable(installation: PluginInstallation): Promise<void>;
  disable(installation: PluginInstallation): Promise<void>;
  healthCheck(installation: PluginInstallation): Promise<boolean>;
}

export interface PluginReconcileResult {
  pluginId: string;
  previousState: PluginInstallation["lifecycleStatus"];
  finalState: PluginInstallation["lifecycleStatus"];
  action: "enabled" | "disabled" | "healthy" | "degraded" | "unchanged" | "skipped";
}

/**
 * Reconciles Core's desired plugin state with a game-specific runtime adapter.
 * This module never downloads or executes artifacts itself. The injected
 * adapter must validate signatures, compatibility and safe installation.
 */
export async function reconcilePluginInstallations(
  client: Pick<CoreApiClient, "getServerPlugins" | "reportPluginHealth">,
  serverId: string,
  runtime: PluginRuntimeAdapter
): Promise<PluginReconcileResult[]> {
  const response = await client.getServerPlugins(serverId);
  const results: PluginReconcileResult[] = [];

  for (const installation of response.data) {
    const previousState = installation.lifecycleStatus;
    let currentState = installation.lifecycleStatus;

    if (currentState === "REMOVED") {
      results.push({ pluginId: installation.pluginId, previousState, finalState: currentState, action: "skipped" });
      continue;
    }

    if (installation.desiredState === "disabled") {
      if (currentState === "DISABLED") {
        results.push({ pluginId: installation.pluginId, previousState, finalState: currentState, action: "unchanged" });
        continue;
      }
      await runtime.disable(installation);
      await client.reportPluginHealth(serverId, installation.pluginId, { lifecycleStatus: "DISABLED" });
      results.push({ pluginId: installation.pluginId, previousState, finalState: "DISABLED", action: "disabled" });
      continue;
    }

    if (currentState === "DISCOVERED" || currentState === "DISABLED") {
      await runtime.validate(installation);
      await client.reportPluginHealth(serverId, installation.pluginId, { lifecycleStatus: "VALIDATED" });
      currentState = "VALIDATED";
    }

    if (currentState === "VALIDATED") {
      await runtime.enable(installation);
      await client.reportPluginHealth(serverId, installation.pluginId, { lifecycleStatus: "ENABLED" });
      currentState = "ENABLED";
    }

    if (currentState === "ENABLED" || currentState === "HEALTHY" || currentState === "DEGRADED") {
      const healthy = await runtime.healthCheck(installation);
      if (healthy && currentState !== "HEALTHY") {
        await client.reportPluginHealth(serverId, installation.pluginId, { lifecycleStatus: "HEALTHY" });
        currentState = "HEALTHY";
      } else if (!healthy && currentState !== "DEGRADED") {
        await client.reportPluginHealth(serverId, installation.pluginId, {
          lifecycleStatus: "DEGRADED",
          healthMessage: "The game runtime health check failed.",
        });
        currentState = "DEGRADED";
      }
    }

    const action = currentState === "HEALTHY" ? "healthy"
      : currentState === "DEGRADED" ? "degraded"
      : currentState === "ENABLED" ? "enabled"
      : "unchanged";
    results.push({ pluginId: installation.pluginId, previousState, finalState: currentState, action });
  }

  return results;
}
