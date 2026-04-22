export default {
  name: "Is Production? (Sub-workflows)",
  description: "Safely determine whether this sub-workflow should run in production or develop mode.",
  key: "is-prod-subworkflow",
  version: "0.2.0",
  type: "action",

  props: {
    headers: {
      type: "object",
      label: "Headers (from webhook event)",
      description: 'Example: `{{steps.trigger.event.headers}}`',
    },
  },

  async run({ $ }) {
    const headers = this.headers

    const headerSaysIsProduction = String(headers['x-is-production']).trim().toLowerCase() === 'true'
    console.log('(headerSaysIsProduction)', headerSaysIsProduction)

    const isInBuildMode = $.context.test
    console.log('(isInBuildMode)', isInBuildMode)

    const isProduction = headerSaysIsProduction && !isInBuildMode
    console.log('isProduction', isProduction)

    return isProduction
  },
}
