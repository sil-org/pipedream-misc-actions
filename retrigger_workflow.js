import { axios } from "@pipedream/platform";
export default {
  name: "Retrigger Workflow",
  description:
    "Start a recursive call to the same workflow, passing in the datastore that will be used to determine whether another call is needed.",
  key: "retrigger_workflow",
  version: "0.2.0",
  type: "action",

  props: {
    datastore: {
      type: "data_store",
      label: "Datastore",
      description:
        "The datastore that will be used to determine whether another call is needed.",
    },
    workflow_url: {
      type: "string",
      label: "Workflow URL",
      description: "This workflow's HTTP endpoint",
    },
    current_key: {
      type: "string",
      label: "Current Key",
      description:
        "This is the current key for the record that was just processed, and will be used to help avoid infinite loops.",
    },
    headers: {
      type: "object",
      label: "Headers (from webhook event)",
      description: "Example: `{{steps.trigger.event.headers}}`"
    },
    headers_to_pass_through: {
      type: "string[]",
      label: "Headers to Pass Through to Retriggered Workflow",
      description: "`authorization` header is recommended at least",
    },
  },
  async run({ steps, $ }) {
    const {
      datastore,
      workflow_url,
      current_key,
      headers,
      headers_to_pass_through,
    } = this

    const keys = await datastore.keys();

    if (keys.includes(current_key)) {
      throw new Error(
        `Infinite loop detected: ${current_key} is still in the list of keys`,
      );
    }

    const headersForRetriggerCall = {}
    for (const headerName in headers) {
      if (headers_to_pass_through?.includes(headerName)) {
        headersForRetriggerCall[headerName] = headers[headerName]
      }
    }

    if (keys.length > 0) {
      await axios($, {
        url: workflow_url,
        method: "GET",
        headers: headersForRetriggerCall,
      });
    }
  },
};
