import { axios } from "@pipedream/platform";
export default {
  name: "Retrigger Workflow",
  description:
    "Start a recursive call to the same workflow, passing in the datastore that will be used to determine whether another call is needed.",
  key: "retrigger_workflow",
  version: "0.0.1",
  type: "action",

  props: {
    data_store: {
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
    api_token: {
      type: "string",
      label: "API Bearer token",
      description:
        "Will be added as a Bearer token in the Authorization header in calls to this workflow's URL.",
      secret: true,
    },
    previous_key: {
      type: "string",
      label: "Previous Key",
      description:
        "This is the previous key for the record that was just processed, and will be used to help avoid infinite loops.",
    },
  },
  async run({ steps, $ }) {
    const datastore = this.data_store;
    const workflow_url = this.workflow_url;
    const api_token = this.api_token;
    const previous_key = this.previous_key;

    const keys = await datastore.keys();
    const next_key = keys.pop();

    if (next_key === previous_key) {
      throw new Error(`Infinite loop detected: ${next_key} == ${previous_key}`);
    }

    if (keys.length > 0) {
      await axios($, {
        url: workflow_url,
        method: "POST",
        headers: { Authorization: `Bearer ${api_token}` },
      });
    }
  },
};
