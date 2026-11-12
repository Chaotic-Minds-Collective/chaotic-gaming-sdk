import test from "node:test";
import assert from "node:assert/strict";
import { reconcilePluginInstallations } from "../dist/plugin-agent.js";

const makeInstallation = (lifecycleStatus, desiredState = "enabled") => ({
  id: "installation-1",
  pluginId: "chaotic.test-plugin",
  name: "Test Plugin",
  game: "7dtd",
  version: "1.0.0",
  lifecycleStatus,
  desiredState,
  healthMessage: null,
  lastHealthAt: null,
  updatedAt: "2026-11-12T00:00:00.000Z",
});

test("validates, enables and health-checks a newly discovered plugin", async () => {
  const reports = [];
  const actions = [];
  const client = {
    getServerPlugins: async () => ({ data: [makeInstallation("DISCOVERED")] }),
    reportPluginHealth: async (_serverId, _pluginId, report) => { reports.push(report.lifecycleStatus); return { data: {} }; },
  };
  const runtime = {
    validate: async () => actions.push("validate"),
    enable: async () => actions.push("enable"),
    disable: async () => actions.push("disable"),
    healthCheck: async () => { actions.push("health"); return true; },
  };

  const result = await reconcilePluginInstallations(client, "server-1", runtime);
  assert.deepEqual(actions, ["validate", "enable", "health"]);
  assert.deepEqual(reports, ["VALIDATED", "ENABLED", "HEALTHY"]);
  assert.equal(result[0].finalState, "HEALTHY");
});

test("disables a plugin when Core desired state is disabled", async () => {
  const reports = [];
  let disabled = false;
  const client = {
    getServerPlugins: async () => ({ data: [makeInstallation("HEALTHY", "disabled")] }),
    reportPluginHealth: async (_serverId, _pluginId, report) => { reports.push(report.lifecycleStatus); return { data: {} }; },
  };
  const runtime = {
    validate: async () => {},
    enable: async () => {},
    disable: async () => { disabled = true; },
    healthCheck: async () => true,
  };

  const result = await reconcilePluginInstallations(client, "server-1", runtime);
  assert.equal(disabled, true);
  assert.deepEqual(reports, ["DISABLED"]);
  assert.equal(result[0].finalState, "DISABLED");
});

test("reports degraded health without claiming success", async () => {
  const reports = [];
  const client = {
    getServerPlugins: async () => ({ data: [makeInstallation("ENABLED")] }),
    reportPluginHealth: async (_serverId, _pluginId, report) => { reports.push(report); return { data: {} }; },
  };
  const runtime = {
    validate: async () => {},
    enable: async () => {},
    disable: async () => {},
    healthCheck: async () => false,
  };

  const result = await reconcilePluginInstallations(client, "server-1", runtime);
  assert.equal(result[0].finalState, "DEGRADED");
  assert.equal(reports[0].lifecycleStatus, "DEGRADED");
  assert.match(reports[0].healthMessage, /health check failed/);
});

test("does not attempt to resurrect removed plugins", async () => {
  let invoked = false;
  const client = {
    getServerPlugins: async () => ({ data: [makeInstallation("REMOVED")] }),
    reportPluginHealth: async () => { invoked = true; return { data: {} }; },
  };
  const runtime = {
    validate: async () => { invoked = true; },
    enable: async () => { invoked = true; },
    disable: async () => { invoked = true; },
    healthCheck: async () => { invoked = true; return true; },
  };

  const result = await reconcilePluginInstallations(client, "server-1", runtime);
  assert.equal(invoked, false);
  assert.equal(result[0].action, "skipped");
});
