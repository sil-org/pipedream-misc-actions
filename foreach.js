import { axios } from '@pipedream/platform';

export default defineComponent({
  name: "Foreach",
  description: "Runs a sub-workflow for each value of an array",
  key: "foreach",
  version: "0.0.1",
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
    }
  },
  async run({ steps, $ }) {
    for await(const record of this.records) {
      await axios($, {
        url: this.workflow_url,
        method: 'POST',
        data: record
      })
    }
  },
})
