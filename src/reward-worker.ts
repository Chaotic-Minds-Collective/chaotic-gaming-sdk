import type { CoreApiClient } from "./client.js";
import type { RewardDelivery } from "./contracts.js";

export interface RewardDeliveryHandler {
  (reward: RewardDelivery): Promise<Record<string, unknown> | void>;
}

export interface RewardBatchResult {
  claimed: number;
  delivered: number;
  failed: number;
  acknowledgementFailures: number;
}

/**
 * Game-specific code supplies the actual grant operation. The handler must
 * deduplicate by reward.idempotencyKey because a successful game grant can
 * be followed by a network failure before Core receives its acknowledgement.
 */
export async function processRewardBatch(
  client: Pick<CoreApiClient, "claimRewards" | "acknowledgeReward">,
  serverId: string,
  deliver: RewardDeliveryHandler,
  { limit = 10, onError = () => {} }: { limit?: number; onError?: (error: unknown, reward: RewardDelivery) => void } = {}
): Promise<RewardBatchResult> {
  const claimed = await client.claimRewards(serverId, { limit });
  const result: RewardBatchResult = {
    claimed: claimed.data.length,
    delivered: 0,
    failed: 0,
    acknowledgementFailures: 0,
  };

  for (const reward of claimed.data) {
    try {
      const receipt = await deliver(reward);
      try {
        await client.acknowledgeReward(serverId, reward.id, {
          outcome: "delivered",
          response: receipt ?? {},
        });
        result.delivered += 1;
      } catch (error) {
        result.acknowledgementFailures += 1;
        onError(error, reward);
      }
    } catch (error) {
      result.failed += 1;
      try {
        await client.acknowledgeReward(serverId, reward.id, {
          outcome: "failed",
          error: error instanceof Error ? error.message.slice(0, 1000) : "Game reward delivery failed.",
        });
      } catch (ackError) {
        result.acknowledgementFailures += 1;
        onError(ackError, reward);
      }
      onError(error, reward);
    }
  }

  return result;
}
