import assert from "node:assert/strict";
import { describe, it } from "node:test";

const { default: component } = await import("./retrigger_workflow.js");

describe("Retrigger Workflow", () => {
  it("should call workflow when datastore has keys", async () => {
    globalThis.__axiosCalls = [];

    const mockDatastore = {
      async keys() {
        return ["key1", "key2"];
      },
    };

    component.dev_datastore = mockDatastore;
    component.workflow_url = "https://example.com/workflow";
    component.headers = {
      authorization: "Bearer test-token",
    };
    component.is_prod = false;
    component.current_key = "different-key";

    await component.run({ steps: {}, $: {} });

    assert.equal(globalThis.__axiosCalls.length, 1);
    assert.equal(
      globalThis.__axiosCalls[0].url,
      "https://example.com/workflow",
    );
  });

  it("should not call workflow when no DEV keys remain (for not-prod)", async () => {
    globalThis.__axiosCalls = [];

    const mockDevDataStore = {
      async keys() {
        return [];
      },
    };

    const mockProdDataStore = {
      async keys() {
        return ["key2", "key3"];
      },
    };

    component.dev_datastore = mockDevDataStore;
    component.prod_datastore = mockProdDataStore;
    component.is_prod = false;
    component.current_key = "key1";

    await component.run({ steps: {}, $: {} });

    assert.equal(globalThis.__axiosCalls.length, 0);
  });

  it("should not call workflow when no PROD keys remain (for prod)", async () => {
    globalThis.__axiosCalls = [];

    const mockDevDataStore = {
      async keys() {
        return ["key2", "key3"];
      },
    };

    const mockProdDataStore = {
      async keys() {
        return [];
      },
    };

    component.dev_datastore = mockDevDataStore;
    component.prod_datastore = mockProdDataStore;
    component.is_prod = true;
    component.current_key = "key1";

    await component.run({ steps: {}, $: {} });

    assert.equal(globalThis.__axiosCalls.length, 0);
  });

  it("should throw error on infinite loop detection", async () => {
    const mockDatastore = {
      async keys() {
        return ["key-1", "loop-key", "key-2"];
      },
    };

    component.dev_datastore = mockDatastore;
    component.is_prod = false;
    component.current_key = "loop-key";

    await assert.rejects(async () => {
      await component.run({ steps: {}, $: {} });
    }, /Infinite loop detected/);
  });

  it("should pass through only the specified headers (case-insensitive)", async () => {
    globalThis.__axiosCalls = [];

    const mockDatastore = {
      async keys() {
        return ["key1", "key2"];
      },
    };

    component.dev_datastore = mockDatastore;
    component.workflow_url = "https://example.com/workflow";
    component.headers = {
      authorization: "Bearer test-token",
      'x-is-production': 'false',
      'User-Agent': 'Dummy User Agent',
      'x-UPPERCASE-test': 'dummy value',
    };
    component.headers_to_pass_through = [
      'x-uppercase-TEST', // Use different capitalization from actual header.
      'authorization',
      'x-is-production',
    ]
    component.is_prod = false;
    component.current_key = "different-key";

    await component.run({ steps: {}, $: {} });

    assert.equal(globalThis.__axiosCalls.length, 1);
    assert.equal(
      globalThis.__axiosCalls[0].url,
      "https://example.com/workflow",
    );
    assert.equal(
      JSON.stringify(globalThis.__axiosCalls[0].headers),
      JSON.stringify({
        authorization: "Bearer test-token",
        'x-is-production': 'false',
        'x-UPPERCASE-test': 'dummy value', // Result should match the actual header.
      })
    )
  });
});
