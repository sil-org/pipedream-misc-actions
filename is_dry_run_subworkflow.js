export default {
  name: "Is Dry Run? (Sub-workflow)",
  description: "Detect whether this is a dry-run",
  key: "is-dry-run-subworkflow",
  version: "0.1.0",
  type: "action",

  props: {
    headers: {
      type: "object",
      label: "Headers (from webhook event)",
      description: 'Example: ``{{steps.trigger.event.headers}}``',
    }
  },

  async run() {
    return String(this.headers['x-is-dry-run']).trim().toLowerCase() === 'true'
  },
}
