import { axios } from '@pipedream/platform';

export default defineComponent({
  name: "Foreach",
  description: "Runs a sub-workflow for each value of an array",
  key: "foreach",
  version: "0.0.4",
  type: "action",

  props: {
    records: {
      type: "any",
      label: "Records to loop",
      description: "The array of records to send to processing workflow",
    },
    workflow_url: {
      type: "string",
      label: "Processing workflow URL",
      description: "The HTTP endpoint to connect to that's processing single individual records from this workflow"
    },
    api_token: {
      type: "string",
      label: "API Bearer token",
      description: "Will be added as a Bearer token in the Authorization header in calls to the workflow URL",
      secret: true
    }
  },
  async run({ steps, $ }) {
    const results = [];
    for await(const record of this.records) {
      const resp = await axios($, {
        url: this.workflow_url,
        method: 'POST',
        data: record,
        headers: {Authorization: `Bearer ${this.api_token}`}
      })
      results.push(resp.data)
    }
    return results
  },
})
