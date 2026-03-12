import { axios } from '@pipedream/platform';

export default defineComponent({
  name: "Foreach",
  description: "Runs a sub-workflow for each value of an array",
  key: "foreach",
  version: "0.0.7",
  type: "action",

  props: {
    records: {
      type: "any",
      label: "Records to loop",
      description: "The array of records to send to processing workflow",
    },
    workflowURL: {
      type: "string",
      label: "Processing workflow URL",
      description: "The HTTP endpoint to connect to that's processing single individual records from this workflow"
    },
    apiToken: {
      type: "string",
      label: "API Bearer token",
      description: "Will be added as a Bearer token in the Authorization header in calls to the workflow URL. Should match the processing workflow.",
      secret: true
    },
    wait: {
      type: "boolean",
      label: "Wait for Results",
      description: "Whether or not to wait for results of each action or keep going. (Default: true)",
      default: true,
    },
    batchSize: {
      type: "integer",
      label: "Batch Size",
      description: "The size of each batch before waiting.",
      optional: true,
    },
    batchInterval: {
      type: "integer",
      label: "Batch Interval (ms)",
      description: "The time, in milliseconds, to wait between each batch.",
      optional: true,
    },
  },
  methods: {
    async delay(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }
  },
  async run({ $ }) {
    if (typeof this.records == "string") {
      this.records = JSON.parse(this.records)
    }
    if (!Array.isArray(this.records)) {
      this.records = [this.records]
    }
    if (!this.wait && !(this.batchSize && this.batchInterval)) {
      throw new Error("Batch Size and Interval are required if not waiting for results.")
    }
    
    const results = [];
    for (let i = 0; i < this.records.length; i++) {
      const resp = axios($, {
        url: this.workflowURL,
        method: 'POST',
        data: this.records[i],
        headers: {Authorization: `Bearer ${this.apiToken}`}
      })
      if (this.wait) {
        results.push(await resp)
      } else {
        results.push(resp)
        if (i > 0 && i % this.batchSize == 0) {
          const now = Date.now();
          await Promise.allSettled(results);
          const elapsed = Date.now() - now;
          await this.delay(this.batchInterval - elapsed);
        }
      }
    }
    if (this.wait) {
      return results
    }
  },
})
