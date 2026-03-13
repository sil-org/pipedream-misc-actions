import { axios } from '@pipedream/platform';

export default defineComponent({
  name: "Foreach",
  description: "Runs a sub-workflow for each value of an array",
  key: "foreach",
  version: "0.1.0",
  type: "action",

  props: {
    records: {
      type: "any",
      label: "Records to loop",
      description: "The array of records to send to processing workflow",
    },
    workflowUrl: {
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
    enableConcurrency: {
      type: "boolean",
      label: "Enable Concurrency",
      description: "Whether to send requests concurrently or one at a time. (Default: false)",
      default: false,
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
    if (!this.enableConcurrency && !(this.batchSize && this.batchInterval)) {
      throw new Error("Batch Size and Interval are required if not waiting for results.")
    }
    
    const results = [];
    for (let i = 0; i < this.records.length; i++) {
      const resp = axios($, {
        url: this.workflowUrl,
        method: 'POST',
        data: this.records[i],
        headers: {Authorization: `Bearer ${this.apiToken}`}
      })
      if (this.enableConcurrency) {
        results.push(resp)
        if (i > 0 && i % this.batchSize == 0) {
          const now = Date.now();
          await Promise.allSettled(results);
          const elapsed = Date.now() - now;
          await this.delay(this.batchInterval - elapsed);
        }
      } else {
        results.push(await resp)
      }
    }
    if (!this.enableConcurrency) {
      return results
    }
  },
})
