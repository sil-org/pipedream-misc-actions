import assert from "node:assert/strict";
import { describe, it } from "node:test";

globalThis.defineComponent = (config) => config;

const { default: component } = await import("./retrigger_workflow.js");

describe("Retrigger Workflow", () => {
  it("should call workflow when datastore has keys", async () => {
    globalThis.__axiosCalls = [];

    const mockDatastore = {
      async keys() {
        return ["key1", "key2"];
      },
    };

    component.data_store = mockDatastore;
    component.workflow_url = "https://example.com/workflow";
    component.api_token = "test-token";
    component.previous_key = "different-key";

    await component.run({ steps: {}, $: {} });

    assert.equal(globalThis.__axiosCalls.length, 1);
    assert.equal(
      globalThis.__axiosCalls[0].url,
      "https://example.com/workflow",
    );
  });

  it("should not call workflow when no keys remain", async () => {
    globalThis.__axiosCalls = [];

    const mockDatastore = {
      async keys() {
        return [];
      },
    };

    component.data_store = mockDatastore;
    component.previous_key = "key1";

    await component.run({ steps: {}, $: {} });

    assert.equal(globalThis.__axiosCalls.length, 0);
  });

  it("should throw error on infinite loop detection", async () => {
    const mockDatastore = {
      async keys() {
        return ["loop-key"];
      },
    };

    component.data_store = mockDatastore;
    component.previous_key = "loop-key";

    await assert.rejects(async () => {
      await component.run({ steps: {}, $: {} });
    }, /Infinite loop detected/);
  });
});
